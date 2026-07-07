package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ApplicationRequest struct {
	Company  string `json:"company"`
	Position string `json:"position"`
	Status   string `json:"status"`
	Notes    string `json:"notes"`
}

func CreateApplication(c *gin.Context) {
	userID := c.GetInt("user_id")

	var req ApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Company == "" || req.Position == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company and position are required"})
		return
	}

	if req.Status == "" {
		req.Status = "Saved"
	}

	_, err := DB.Exec(
		context.Background(),
		`
		INSERT INTO applications(user_id, company, position, status, notes)
		VALUES($1, $2, $3, $4, $5)
		`,
		userID,
		req.Company,
		req.Position,
		req.Status,
		req.Notes,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Application added successfully"})
}

func GetApplications(c *gin.Context) {
	userID := c.GetInt("user_id")

	fmt.Println("Fetching applications for user:", userID)

	rows, err := DB.Query(
		context.Background(),
		`
		SELECT 
			id,
			company,
			position,
			status,
			COALESCE(notes, '') AS notes,
			applied_date::text
		FROM applications
		WHERE user_id = $1
		ORDER BY created_at DESC
		`,
		userID,
	)

	if err != nil {
		fmt.Println("QUERY ERROR:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications"})
		return
	}
	defer rows.Close()

	applications := []gin.H{}

	for rows.Next() {
		var id int
		var company string
		var position string
		var status string
		var notes string
		var appliedDate string

		err := rows.Scan(&id, &company, &position, &status, &notes, &appliedDate)
		if err != nil {
			fmt.Println("SCAN ERROR:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		applications = append(applications, gin.H{
			"id":           id,
			"company":      company,
			"position":     position,
			"status":       status,
			"notes":        notes,
			"applied_date": appliedDate,
		})
	}

	if err := rows.Err(); err != nil {
		fmt.Println("ROWS ERROR:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"applications": applications})
}

func UpdateApplicationStatus(c *gin.Context) {
	userID := c.GetInt("user_id")
	appID, err := strconv.Atoi(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application id"})
		return
	}

	var req ApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status is required"})
		return
	}

	_, err = DB.Exec(
		context.Background(),
		`
		UPDATE applications
		SET status = $1, notes = COALESCE(NULLIF($2, ''), notes)
		WHERE id = $3 AND user_id = $4
		`,
		req.Status,
		req.Notes,
		appID,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Application updated successfully"})
}

func DeleteApplication(c *gin.Context) {
	userID := c.GetInt("user_id")
	appID, err := strconv.Atoi(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application id"})
		return
	}

	_, err = DB.Exec(
		context.Background(),
		`
		DELETE FROM applications
		WHERE id = $1 AND user_id = $2
		`,
		appID,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Application deleted successfully"})
}