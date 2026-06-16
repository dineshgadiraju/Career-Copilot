package main

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	ConnectDB()
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000",
		},
		AllowMethods: []string{
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"OPTIONS",
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Authorization",
		},
		ExposeHeaders: []string{
			"Content-Length",
		},
		AllowCredentials: true,
	}))

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
	router.GET("/jobs/recommended", AuthMiddleware(), GetRecommendedJobs)
	router.POST("/chat", AuthMiddleware(), CareerChat)
	router.Run(":8081")
}
