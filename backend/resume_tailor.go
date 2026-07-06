package main

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type TailorResumeRequest struct {
	JobDescription string `json:"job_description"`
}

func TailorResume(c *gin.Context) {
	userID := c.GetInt("user_id")

	var req TailorResumeRequest

	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.JobDescription) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Job description is required",
		})
		return
	}

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
			"error": "No resume found. Upload a resume first.",
		})
		return
	}

	jobSkills := extractSkillsFromText(req.JobDescription)

	matchedSkills := []string{}
	missingSkills := []string{}

	for _, skill := range jobSkills {
		if containsSkill(resumeSkills, skill) {
			matchedSkills = append(matchedSkills, skill)
		} else {
			missingSkills = append(missingSkills, skill)
		}
	}

	atsScore := 0
	if len(jobSkills) > 0 {
		atsScore = (len(matchedSkills) * 100) / len(jobSkills)
	}

	suggestions := []string{
		"Add missing skills naturally if you have real experience with them.",
		"Quantify project impact using numbers, performance improvements, or user outcomes.",
		"Align your resume bullets with the job description keywords.",
		"Highlight backend, database, API, cloud, and deployment experience where relevant.",
	}

	c.JSON(http.StatusOK, gin.H{
		"ats_score":      atsScore,
		"resume_skills":  resumeSkills,
		"job_skills":     jobSkills,
		"matched_skills": matchedSkills,
		"missing_skills": missingSkills,
		"suggestions":    suggestions,
	})
}
