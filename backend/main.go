package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}

	ConnectDB()

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000",
			"https://hilarious-kataifi-9685f0.netlify.app",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: false,
	}))

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "Backend Running",
		})
	})

	router.POST("/register", Register)
	router.POST("/login", Login)
	router.GET("/profile", AuthMiddleware(), GetProfile)

	router.POST("/resume/upload", AuthMiddleware(), UploadResume)
	router.GET("/resume/latest", AuthMiddleware(), GetLatestResume)
	router.GET("/dashboard", AuthMiddleware(), GetDashboard)

	router.GET("/jobs/recommended", AuthMiddleware(), GetRecommendedJobs)
	router.POST("/jobs/fetch-live", AuthMiddleware(), FetchLiveJobs)
	router.GET("/jobs/live-recommended", AuthMiddleware(), GetLiveRecommendedJobs)

	router.GET("/roadmap", AuthMiddleware(), GetCareerRoadmap)
	router.POST("/chat", AuthMiddleware(), CareerChat)

	router.POST("/saved-jobs", AuthMiddleware(), SaveJob)
	router.GET("/saved-jobs", AuthMiddleware(), GetSavedJobs)
	router.PUT("/saved-jobs/:id/status", AuthMiddleware(), UpdateSavedJobStatus)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	router.Run(":" + port)
}
