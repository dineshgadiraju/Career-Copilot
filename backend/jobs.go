package main

import (
	"context"
	"net/http"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
)

type JobRecommendation struct {
	ID                      int      `json:"id"`
	Title                   string   `json:"title"`
	Company                 string   `json:"company"`
	RequiredSkills          []string `json:"required_skills"`
	MatchedSkills           []string `json:"matched_skills"`
	MissingSkills           []string `json:"missing_skills"`
	LearningRecommendations []string `json:"learning_recommendations"`
	MatchScore              int      `json:"match_score"`
	ApplyURL                string   `json:"apply_url"`
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
			"error": "No resume found",
		})
		return
	}

	rows, err := DB.Query(
		context.Background(),
		`
		SELECT id, title, company, required_skills, COALESCE(apply_url, '')
		FROM jobs
		`,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch jobs",
		})
		return
	}

	defer rows.Close()

	recommendations := []JobRecommendation{}

	for rows.Next() {
		var job JobRecommendation

		err := rows.Scan(
			&job.ID,
			&job.Title,
			&job.Company,
			&job.RequiredSkills,
			&job.ApplyURL,
		)

		if err != nil {
			continue
		}

		for _, requiredSkill := range job.RequiredSkills {
			if containsSkill(resumeSkills, requiredSkill) {
				job.MatchedSkills = append(job.MatchedSkills, requiredSkill)
			} else {
				job.MissingSkills = append(job.MissingSkills, requiredSkill)
				job.LearningRecommendations = append(
					job.LearningRecommendations,
					requiredSkill,
				)
			}
		}

		if len(job.RequiredSkills) > 0 {
			job.MatchScore = (len(job.MatchedSkills) * 100) / len(job.RequiredSkills)
		}

		recommendations = append(recommendations, job)
	}

	sort.Slice(recommendations, func(i, j int) bool {
		return recommendations[i].MatchScore > recommendations[j].MatchScore
	})

	c.JSON(http.StatusOK, gin.H{
		"jobs": recommendations,
	})
}
