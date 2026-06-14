package main

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
)

type JobRecommendation struct {
	ID             int      `json:"id"`
	Title          string   `json:"title"`
	Company        string   `json:"company"`
	RequiredSkills []string `json:"required_skills"`
	MatchedSkills  []string `json:"matched_skills"`
	MissingSkills  []string `json:"missing_skills"`
	MatchScore     int      `json:"match_score"`
}

func containsSkill(skills []string, target string) bool {
	for _, skill := range skills {
		if skill == target {
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
		SELECT id, title, company, required_skills
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
		)

		if err != nil {
			continue
		}

		for _, requiredSkill := range job.RequiredSkills {
			if containsSkill(resumeSkills, requiredSkill) {
				job.MatchedSkills = append(job.MatchedSkills, requiredSkill)
			} else {
				job.MissingSkills = append(job.MissingSkills, requiredSkill)
			}
		}

		if len(job.RequiredSkills) > 0 {
			job.MatchScore = (len(job.MatchedSkills) * 100) / len(job.RequiredSkills)
		}

		recommendations = append(recommendations, job)
	}

	c.JSON(http.StatusOK, gin.H{
		"jobs": recommendations,
	})
}