package main

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type SaveTailorResultRequest struct {
	JobTitle      string   `json:"job_title"`
	Company       string   `json:"company"`
	ATSScore      int      `json:"ats_score"`
	MatchedSkills []string `json:"matched_skills"`
	MissingSkills []string `json:"missing_skills"`
	AIFeedback    string   `json:"ai_feedback"`
}
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
func extractSkillsFromText(text string) []string {
	text = strings.ToLower(text)

	skillKeywords := []string{
		"java",
		"python",
		"go",
		"golang",
		"javascript",
		"typescript",
		"react",
		"next.js",
		"node.js",
		"express",
		"html",
		"css",
		"tailwind",
		"sql",
		"postgresql",
		"mysql",
		"mongodb",
		"redis",
		"docker",
		"kubernetes",
		"aws",
		"azure",
		"gcp",
		"rest",
		"graphql",
		"api",
		"microservices",
		"ci/cd",
		"github actions",
		"fastapi",
		"gin",
		"machine learning",
		"tensorflow",
		"pytorch",
		"scikit-learn",
		"nlp",
		"llm",
	}

	foundSkills := []string{}

	for _, skill := range skillKeywords {
		if strings.Contains(text, skill) {
			foundSkills = append(foundSkills, skill)
		}
	}

	return foundSkills
}
func SaveTailorResult(c *gin.Context) {
	userID := c.GetInt("user_id")

	var req SaveTailorResultRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := DB.Exec(
		context.Background(),
		`
		INSERT INTO tailored_resumes
		(user_id, job_title, company, ats_score, matched_skills, missing_skills, ai_feedback)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		`,
		userID,
		req.JobTitle,
		req.Company,
		req.ATSScore,
		req.MatchedSkills,
		req.MissingSkills,
		req.AIFeedback,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tailoring result saved"})
}

func GetTailorHistory(c *gin.Context) {
	userID := c.GetInt("user_id")
	fmt.Println("Logged in user ID:", userID)
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT id, job_title, company, ats_score, matched_skills, missing_skills, ai_feedback, created_at
		FROM tailored_resumes
		WHERE user_id = $1
		ORDER BY created_at DESC
		`,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tailor history"})
		return
	}
	defer rows.Close()

	history := []gin.H{}
	count := 0
	for rows.Next() {
		count++
		fmt.Println("Found history row:", count)
		var id int
		var jobTitle string
		var company string
		var atsScore int
		var matchedSkills []string
		var missingSkills []string
		var aiFeedback string
		var createdAt time.Time

		err := rows.Scan(
			&id,
			&jobTitle,
			&company,
			&atsScore,
			&matchedSkills,
			&missingSkills,
			&aiFeedback,
			&createdAt,
		)

		if err != nil {
			fmt.Println("SCAN ERROR:", err)
			continue
		}

		history = append(history, gin.H{
			"id":             id,
			"job_title":      jobTitle,
			"company":        company,
			"ats_score":      atsScore,
			"matched_skills": matchedSkills,
			"missing_skills": missingSkills,
			"ai_feedback":    aiFeedback,
			"created_at": createdAt.Format("2006-01-02 15:04"),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id": userID,
		"history": history,
	})
}
