package main

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetLatestResume(c *gin.Context) {
	userID := c.GetInt("user_id")

	var filename string
	var score int
	var skills []string

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT filename, score, skills
		FROM resumes
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
		`,
		userID,
	).Scan(&filename, &score, &skills)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No resume found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"filename": filename,
		"score":    score,
		"skills":   skills,
	})
}

func GetDashboard(c *gin.Context) {
	userID := c.GetInt("user_id")

	var name string
	var filename string
	var score int
	var skills []string
	var uploads int

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT name
		FROM users
		WHERE id = $1
		`,
		userID,
	).Scan(&name)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	err = DB.QueryRow(
		context.Background(),
		`
		SELECT filename, score, skills
		FROM resumes
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
		`,
		userID,
	).Scan(&filename, &score, &skills)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No resume found",
		})
		return
	}

	err = DB.QueryRow(
		context.Background(),
		`
		SELECT COUNT(*)
		FROM resumes
		WHERE user_id = $1
		`,
		userID,
	).Scan(&uploads)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to count uploads",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":         name,
		"latest_file":  filename,
		"resume_score": score,
		"skills":       skills,
		"uploads":      uploads,
	})
}
