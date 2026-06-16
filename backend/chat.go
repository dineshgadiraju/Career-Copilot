package main

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type ChatRequest struct {
	Message string `json:"message"`
}

func CareerChat(c *gin.Context) {
	var req ChatRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request",
		})
		return
	}

	message := strings.ToLower(req.Message)

	reply := "I can help you improve your resume, prepare for interviews, and choose skills to learn."

	if strings.Contains(message, "resume") {
		reply = "To improve your resume, add stronger project descriptions, include measurable impact, and highlight Go, Python, SQL, Docker, PostgreSQL, and FastAPI experience."
	} else if strings.Contains(message, "learn") || strings.Contains(message, "skills") {
		reply = "Based on your career path, focus on Go, PostgreSQL, Docker, AWS, Kubernetes, system design, and backend API development."
	} else if strings.Contains(message, "interview") {
		reply = "For backend interviews, practice Go basics, SQL queries, REST APIs, JWT authentication, Docker, concurrency, and system design."
	} else if strings.Contains(message, "job") {
		reply = "For backend roles, target Go Backend Developer, Full Stack Developer, Python ML Engineer, and Cloud Engineer positions."
	}

	c.JSON(http.StatusOK, gin.H{
		"reply": reply,
	})
}
