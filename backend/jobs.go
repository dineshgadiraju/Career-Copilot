package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
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

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT skills
		FROM resumes
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
		`,
		userID,
	).Scan(&resumeSkills)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Upload a resume first to get personalized jobs",
		})
		return
	}

	searchTerms := "software engineer"

	if len(resumeSkills) > 0 {
		searchTerms = strings.Join(resumeSkills, " ")
	}

	apiURL := "https://remotive.com/api/remote-jobs?search=" + url.QueryEscape(searchTerms)

	resp, err := http.Get(apiURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch live jobs",
		})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Jobs API returned an error",
		})
		return
	}

	var remotiveData RemotiveResponse

	err = json.NewDecoder(resp.Body).Decode(&remotiveData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to parse jobs response",
		})
		return
	}

	recommendations := []JobRecommendation{}

	for _, liveJob := range remotiveData.Jobs {
		location := strings.ToLower(liveJob.CandidateRequiredLocation)

		isUSJob := strings.Contains(location, "united states") ||
			strings.Contains(location, "usa") ||
			strings.Contains(location, "u.s") ||
			strings.Contains(location, "us only") ||
			strings.Contains(location, "north america")

		if !isUSJob {
			continue
		}
		jobText := liveJob.Title + " " + liveJob.Description

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
			MatchedSkills: matchedSkills,
			MissingSkills: missingSkills,
			MatchScore:    matchScore,
			ApplyURL:      liveJob.URL,
		})
	}

	sort.Slice(recommendations, func(i, j int) bool {
		return recommendations[i].MatchScore > recommendations[j].MatchScore
	})

	if len(recommendations) > 20 {
		recommendations = recommendations[:20]
	}

	c.JSON(http.StatusOK, gin.H{
		"jobs":  recommendations,
		"query": searchTerms,
	})
}
