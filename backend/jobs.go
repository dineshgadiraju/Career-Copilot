package main

import (
	"context"
	"encoding/json"
	"net/http"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
)

type RemotiveResponse struct {
	Jobs []RemotiveJob `json:"jobs"`
}

type RemotiveJob struct {
	ID                        int    `json:"id"`
	Title                     string `json:"title"`
	CompanyName               string `json:"company_name"`
	URL                       string `json:"url"`
	JobType                   string `json:"job_type"`
	CandidateRequiredLocation string `json:"candidate_required_location"`
	Description               string `json:"description"`
}

type JobRecommendation struct {
	ID            int      `json:"id"`
	Title         string   `json:"title"`
	Company       string   `json:"company"`
	Location      string   `json:"location"`
	JobType       string   `json:"job_type"`
	Description   string   `json:"description"`
	MatchedSkills []string `json:"matched_skills"`
	MissingSkills []string `json:"missing_skills"`
	MatchScore    int      `json:"match_score"`
	ApplyURL      string   `json:"apply_url"`
}

func normalizeSkill(skill string) string {
	return strings.ToLower(strings.TrimSpace(skill))
}
func containsSkill(skills []string, target string) bool {
	target = normalizeSkill(target)

	for _, skill := range skills {
		if normalizeSkill(skill) == target {
			return true
		}
	}

	return false
}

func containsText(text string, target string) bool {
	return strings.Contains(strings.ToLower(text), strings.ToLower(target))
}

func GetRecommendedJobs(c *gin.Context) {
	userID := c.GetInt("user_id")

	var resumeSkills []string
	var resumeText string

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT skills, resume_text
		FROM resumes
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
		`,
		userID,
	).Scan(&resumeSkills, &resumeText)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Upload a resume first to get personalized jobs",
		})
		return
	}

	// Get AI recommended roles
	roleResponse, err := RecommendRoles(resumeText)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get AI role recommendations: " + err.Error(),
		})
		return
	}

	searchTermsList := roleResponse.Roles
	if len(searchTermsList) == 0 {
		searchTermsList = []string{"Software Engineer"}
	}

	// Fetch jobs
	apiURL := "https://remotive.com/api/remote-jobs?search=developer"

	resp, err := http.Get(apiURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	var remotiveData RemotiveResponse

	if err := json.NewDecoder(resp.Body).Decode(&remotiveData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// THIS WAS MISSING
	allJobs := remotiveData.Jobs

	println("Total jobs fetched:", len(allJobs))

	recommendations := []JobRecommendation{}

	for _, liveJob := range allJobs {

		jobTitle := strings.ToLower(liveJob.Title)

		relevant := false

		keywords := []string{
			"backend",
			"golang",
			"go",
			"software",
			"engineer",
			"developer",
			"full stack",
			"fullstack",
			"platform",
			"ai",
			"ml",
			"machine learning",
			"python",
		}

		for _, keyword := range keywords {
			if strings.Contains(jobTitle, keyword) {
				relevant = true
				break
			}
		}

		if !relevant {
			for _, role := range searchTermsList {
				role = strings.ToLower(strings.TrimSpace(role))
				if role != "" && strings.Contains(jobTitle, role) {
					relevant = true
					break
				}
			}
		}

		if !relevant {
			continue
		}

		//location := strings.ToLower(liveJob.CandidateRequiredLocation)

		//isUSJob := strings.Contains(location, "united states") ||
		//strings.Contains(location, "usa") ||
		//strings.Contains(location, "u.s") ||
		//strings.Contains(location, "us only") ||
		//strings.Contains(location, "north america")

		//if !isUSJob {
		//	continue
		//}

		jobText := strings.ToLower(liveJob.Title + " " + liveJob.Description)

		matchedSkills := []string{}
		missingSkills := []string{}

		for _, skill := range resumeSkills {
			if containsText(jobText, skill) {
				matchedSkills = append(matchedSkills, skill)
			} else {
				missingSkills = append(missingSkills, skill)
			}
		}

		matchScore := 0
		if len(resumeSkills) > 0 {
			matchScore = (len(matchedSkills) * 100) / len(resumeSkills)
		}

		recommendations = append(recommendations, JobRecommendation{
			ID:            liveJob.ID,
			Title:         liveJob.Title,
			Company:       liveJob.CompanyName,
			Location:      liveJob.CandidateRequiredLocation,
			JobType:       liveJob.JobType,
			Description:   liveJob.Description,
			MatchedSkills: matchedSkills,
			MissingSkills: missingSkills,
			MatchScore:    matchScore,
			ApplyURL:      liveJob.URL,
		})
	}

	println("Jobs after filtering:", len(recommendations))

	sort.Slice(recommendations, func(i, j int) bool {
		return recommendations[i].MatchScore > recommendations[j].MatchScore
	})

	if len(recommendations) > 20 {
		recommendations = recommendations[:20]
	}

	c.JSON(http.StatusOK, gin.H{
		"jobs":       recommendations,
		"query":      searchTermsList,
		"ai_roles":   roleResponse.Roles,
		"total_jobs": len(recommendations),
	})
}
