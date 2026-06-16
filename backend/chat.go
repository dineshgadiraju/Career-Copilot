package main

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type ChatRequest struct {
	Message string `json:"message"`
}

func CareerChat(c *gin.Context) {
	userID := c.GetInt("user_id")

	var req ChatRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request",
		})
		return
	}

	message := strings.ToLower(req.Message)

	var skills []string
	var score int

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT skills, score
		FROM resumes
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
		`,
		userID,
	).Scan(&skills, &score)

	if err != nil {
		skills = []string{}
		score = 0
	}

	var missingSkills []string

	rows, err := DB.Query(
		context.Background(),
		`
		SELECT required_skills
		FROM jobs
		`,
	)

	if err == nil {
		defer rows.Close()

		skillMap := map[string]bool{}

		for _, skill := range skills {
			skillMap[strings.ToLower(skill)] = true
		}

		missingMap := map[string]bool{}

		for rows.Next() {
			var requiredSkills []string

			if err := rows.Scan(&requiredSkills); err != nil {
				continue
			}

			for _, skill := range requiredSkills {
				normalized := strings.ToLower(skill)

				if !skillMap[normalized] {
					missingMap[normalized] = true
				}
			}
		}

		for skill := range missingMap {
			missingSkills = append(missingSkills, skill)
		}
	}

	reply := "I can help you improve your resume, prepare for interviews, and choose skills to learn."

	if strings.Contains(message, "resume") {
		reply = "Your resume score is " + intToString(score) + "%. Your detected skills are: " + strings.Join(skills, ", ") + ". To improve it, add measurable project impact, backend architecture details, API endpoints, database work, and deployment details."
	} else if strings.Contains(message, "learn") || strings.Contains(message, "skills") {
		if len(missingSkills) > 0 {
			reply = "Based on your resume and job matches, you should learn: " + strings.Join(missingSkills, ", ") + ". These skills will improve your job match score."
		} else {
			reply = "Your current skill profile looks strong. Next, focus on system design, deployment, testing, and production-level backend architecture."
		}
	} else if strings.Contains(message, "interview") {
		reply = "For backend interviews, practice Go fundamentals, REST APIs, SQL queries, JWT authentication, Docker, PostgreSQL, concurrency, and system design."
	} else if strings.Contains(message, "job") {
		reply = "Based on your resume, you should target backend developer, Go developer, full-stack developer, and Python ML engineer roles."
	}

	c.JSON(http.StatusOK, gin.H{
		"reply": reply,
	})
}

func intToString(num int) string {
	return strconv.Itoa(num)
}
