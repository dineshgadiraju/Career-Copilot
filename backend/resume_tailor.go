package main

import (
	"context"
	"fmt"
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

	prompt := fmt.Sprintf(`
Resume Skills:
%v

Job Description:
%s

ATS Score:
%d

Matched Skills:
%v

Missing Skills:
%v

Give feedback in this format:

1. Overall Fit Summary
2. Recruiter Perspective
3. Missing Keywords
4. Resume Improvements
5. Suggested Resume Bullet Points
6. Interview Preparation Tips
`, resumeSkills, req.JobDescription, atsScore, matchedSkills, missingSkills)

	aiFeedback, err := CallOpenAI(
		"You are an expert technical recruiter and resume coach. Give concise, practical resume feedback for software engineering roles.",
		prompt,
		700,
	)

	if err != nil {
		aiFeedback = "AI feedback unavailable right now. Basic skill matching completed successfully."
	}

	c.JSON(http.StatusOK, gin.H{
		"ats_score":      atsScore,
		"resume_skills":  resumeSkills,
		"job_skills":     jobSkills,
		"matched_skills": matchedSkills,
		"missing_skills": missingSkills,
		"ai_feedback":    aiFeedback,
	})
}