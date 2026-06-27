package main

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type RoleRecommendation struct {
	RecommendedRole string      `json:"recommended_role"`
	Reason          string      `json:"reason"`
	CurrentSkills   []string    `json:"current_skills"`
	NextSkills      []string    `json:"next_skills"`
	MatchedSignals  []string    `json:"matched_signals"`
	RoleScores      []RoleScore `json:"role_scores"`
}

type RoleScore struct {
	Role  string `json:"role"`
	Score int    `json:"score"`
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
	skillSet := map[string]bool{}

	for _, skill := range skills {
		normalized := strings.ToLower(strings.TrimSpace(skill))
		skillSet[normalized] = true
	}

	roles := []struct {
		Name       string
		Keywords   []string
		NextSkills []string
		Reason     string
	}{
		{
			Name: "Backend Software Engineer",
			Keywords: []string{
				"go", "golang", "java", "python", "node", "node.js",
				"sql", "postgresql", "mysql", "mongodb",
				"api", "rest", "graphql", "docker", "kubernetes",
				"aws", "redis", "linux",
			},
			NextSkills: []string{
				"System Design", "Redis", "Kubernetes", "AWS", "CI/CD",
			},
			Reason: "Your resume has strong backend signals such as APIs, databases, server-side languages, and cloud/deployment skills.",
		},
		{
			Name: "Full Stack Engineer",
			Keywords: []string{
				"javascript", "typescript", "react", "next.js", "node", "node.js",
				"html", "css", "tailwind", "sql", "postgresql", "mongodb",
				"api", "rest",
			},
			NextSkills: []string{
				"Testing", "Next.js", "System Design", "PostgreSQL", "Cloud Deployment",
			},
			Reason: "Your resume shows both frontend and backend web development skills.",
		},
		{
			Name: "AI/ML Engineer",
			Keywords: []string{
				"python", "machine learning", "deep learning", "tensorflow", "pytorch",
				"scikit-learn", "pandas", "numpy", "nlp", "llm", "fastapi",
				"data mining", "xgboost", "lstm",
			},
			NextSkills: []string{
				"MLOps", "Vector Databases", "LLMs", "FastAPI", "AWS SageMaker",
			},
			Reason: "Your resume has AI/ML signals such as Python, machine learning, model building, and data science tooling.",
		},
		{
			Name: "Frontend Engineer",
			Keywords: []string{
				"javascript", "typescript", "react", "next.js", "html", "css",
				"tailwind", "ui", "frontend",
			},
			NextSkills: []string{
				"Advanced React", "Testing", "Design Systems", "Accessibility", "Performance Optimization",
			},
			Reason: "Your resume shows frontend engineering signals such as React, TypeScript, UI, and web application skills.",
		},
		{
			Name: "Data Engineer",
			Keywords: []string{
				"python", "sql", "postgresql", "mysql", "spark", "hadoop",
				"etl", "airflow", "data pipeline", "aws", "bigquery",
			},
			NextSkills: []string{
				"Airflow", "Spark", "Kafka", "Data Warehousing", "dbt",
			},
			Reason: "Your resume shows data processing and database skills that fit data engineering roles.",
		},
	}

	bestRole := roles[0]
	bestScore := -1
	bestSignals := []string{}
	roleScores := []RoleScore{}

	for _, role := range roles {
		score := 0
		signals := []string{}

		for _, keyword := range role.Keywords {
			if skillSet[keyword] {
				score++
				signals = append(signals, keyword)
			}
		}

		percentage := 0
		if len(role.Keywords) > 0 {
			percentage = (score * 100) / len(role.Keywords)
		}

		roleScores = append(roleScores, RoleScore{
			Role:  role.Name,
			Score: percentage,
		})

		if percentage > bestScore {
			bestScore = percentage
			bestRole = role
			bestSignals = signals
		}
	}

	return RoleRecommendation{
		RecommendedRole: bestRole.Name,
		Reason:          bestRole.Reason,
		CurrentSkills:   skills,
		NextSkills:      bestRole.NextSkills,
		MatchedSignals:  bestSignals,
		RoleScores:      roleScores,
	}
}
