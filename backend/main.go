package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	ConnectDB()
	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "Backend Running",
		})
	})
	router.POST("/register", Register)
	router.POST("/login", Login)
	router.GET(
		"/profile",
		AuthMiddleware(),
		GetProfile)
	router.POST(
		"/resume/upload",
		AuthMiddleware(),
		UploadResume,
	)
	router.GET(
		"/resume/latest",
		AuthMiddleware(),
		GetLatestResume,
	)
	router.GET("/dashboard", AuthMiddleware(), GetDashboard)

	router.Run(":8081")
}
