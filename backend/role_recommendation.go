package main

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type RoleRecommendation struct {
	RecommendedRole string   `json:"recommended_role"`
	Reason          string   `json:"reason"`
	CurrentSkills   []string `json:"current_skills"`
	NextSkills      []string `json:"next_skills"`
}

func GetRecommendedRole(c *gin.Context) {
	userID := c.GetInt("user_id")

	var skills []string

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
	).Scan(&skills)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No resume found",
		})
		return
	}

	role := recommendRoleFromSkills(skills)

	c.JSON(http.StatusOK, role)
}

func recommendRoleFromSkills(skills []string) RoleRecommendation {
	skillText := strings.ToLower(strings.Join(skills, " "))

	if strings.Contains(skillText, "go") ||
		strings.Contains(skillText, "golang") ||
		strings.Contains(skillText, "postgresql") ||
		strings.Contains(skillText, "docker") {
		return RoleRecommendation{
			RecommendedRole: "Go Backend Engineer",
			Reason:          "Your resume shows backend-focused skills such as Go, SQL/PostgreSQL, APIs, and Docker.",
			CurrentSkills:   skills,
			NextSkills:      []string{"AWS", "Redis", "Kubernetes", "System Design", "CI/CD"},
		}
	}

	if strings.Contains(skillText, "python") ||
		strings.Contains(skillText, "machine learning") ||
		strings.Contains(skillText, "tensorflow") ||
		strings.Contains(skillText, "pytorch") {
		return RoleRecommendation{
			RecommendedRole: "AI/ML Engineer",
			Reason:          "Your resume shows strong Python and machine learning signals.",
			CurrentSkills:   skills,
			NextSkills:      []string{"MLOps", "FastAPI", "Vector Databases", "LLMs", "AWS SageMaker"},
		}
	}

	if strings.Contains(skillText, "react") ||
		strings.Contains(skillText, "next.js") ||
		strings.Contains(skillText, "typescript") {
		return RoleRecommendation{
			RecommendedRole: "Full Stack Engineer",
			Reason:          "Your resume shows frontend and backend web development skills.",
			CurrentSkills:   skills,
			NextSkills:      []string{"Next.js", "Testing", "Cloud Deployment", "PostgreSQL", "System Design"},
		}
	}

	return RoleRecommendation{
		RecommendedRole: "Software Engineer",
		Reason:          "Your resume shows general software engineering skills.",
		CurrentSkills:   skills,
		NextSkills:      []string{"Data Structures", "System Design", "APIs", "Databases", "Cloud"},
	}
}
