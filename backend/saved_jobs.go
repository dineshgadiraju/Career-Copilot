package main

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type SaveJobRequest struct {
	JobTitle string `json:"job_title"`
	Company  string `json:"company"`
	ApplyURL string `json:"apply_url"`
}

type UpdateJobStatusRequest struct {
	Status string `json:"status"`
}

func SaveJob(c *gin.Context) {
	userID := c.GetInt("user_id")

	var req SaveJobRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := DB.Exec(
		context.Background(),
		`
		INSERT INTO saved_jobs(user_id, job_title, company, apply_url, status)
		VALUES($1, $2, $3, $4, 'saved')
		`,
		userID,
		req.JobTitle,
		req.Company,
		req.ApplyURL,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save job"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Job saved successfully"})
}

func GetSavedJobs(c *gin.Context) {
	userID := c.GetInt("user_id")

	rows, err := DB.Query(
		context.Background(),
		`
		SELECT id, job_title, company, apply_url, status, created_at
		FROM saved_jobs
		WHERE user_id = $1
		ORDER BY created_at DESC
		`,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	defer rows.Close()

	savedJobs := []gin.H{}

	for rows.Next() {
		var id int
		var jobTitle string
		var company string
		var applyURL string
		var status string
		var createdAt time.Time

		err := rows.Scan(
			&id,
			&jobTitle,
			&company,
			&applyURL,
			&status,
			&createdAt,
		)

		if err != nil {
			continue
		}

		savedJobs = append(savedJobs, gin.H{
			"id":         id,
			"job_title":  jobTitle,
			"company":    company,
			"apply_url":  applyURL,
			"status":     status,
			"created_at": createdAt.Format("2006-01-02 15:04"),
		})
	}

	c.JSON(http.StatusOK, gin.H{"jobs": savedJobs})
}

func UpdateSavedJobStatus(c *gin.Context) {
	userID := c.GetInt("user_id")
	jobID := c.Param("id")

	var req UpdateJobStatusRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	allowedStatuses := map[string]bool{
		"saved":     true,
		"applied":   true,
		"interview": true,
		"rejected":  true,
		"offer":     true,
	}

	if !allowedStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	_, err := DB.Exec(
		context.Background(),
		`
		UPDATE saved_jobs
		SET status = $1
		WHERE id = $2 AND user_id = $3
		`,
		req.Status,
		jobID,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Job status updated"})
}
