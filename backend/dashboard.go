package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

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
	cacheKey := "dashboard:user:" + strconv.Itoa(userID)

	if RedisClient != nil {
		cachedDashboard, err := RedisClient.Get(Ctx, cacheKey).Result()
		if err == nil {
			var cachedData gin.H
			if json.Unmarshal([]byte(cachedDashboard), &cachedData) == nil {
				c.JSON(http.StatusOK, cachedData)
				return
			}
		}
	}

	var name string
	var filename string = "No resume uploaded"
	var score int = 0
	var skills []string = []string{}
	var uploads int = 0

	var totalApplications int = 0
	var interviews int = 0
	var offers int = 0
	var rejected int = 0

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

	_ = DB.QueryRow(
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

	_ = DB.QueryRow(
		context.Background(),
		`
		SELECT COUNT(*)
		FROM resumes
		WHERE user_id = $1
		`,
		userID,
	).Scan(&uploads)

	_ = DB.QueryRow(
		context.Background(),
		`
		SELECT COUNT(*)
		FROM applications
		WHERE user_id = $1
		`,
		userID,
	).Scan(&totalApplications)

	_ = DB.QueryRow(
		context.Background(),
		`
		SELECT COUNT(*)
		FROM applications
		WHERE user_id = $1 AND LOWER(status) = 'interview'
		`,
		userID,
	).Scan(&interviews)

	_ = DB.QueryRow(
		context.Background(),
		`
		SELECT COUNT(*)
		FROM applications
		WHERE user_id = $1 AND LOWER(status) = 'offer'
		`,
		userID,
	).Scan(&offers)

	_ = DB.QueryRow(
		context.Background(),
		`
		SELECT COUNT(*)
		FROM applications
		WHERE user_id = $1 AND LOWER(status) = 'rejected'
		`,
		userID,
	).Scan(&rejected)

	response := gin.H{
		"user":               name,
		"latest_file":        filename,
		"resume_score":       score,
		"skills":             skills,
		"uploads":            uploads,
		"total_applications": totalApplications,
		"interviews":         interviews,
		"offers":             offers,
		"rejected":           rejected,
		"cached":             false,
	}

	if RedisClient != nil {
		jsonData, err := json.Marshal(response)
		if err == nil {
			RedisClient.Set(Ctx, cacheKey, jsonData, 10*time.Minute)
		}
	}

	c.JSON(http.StatusOK, response)
}
