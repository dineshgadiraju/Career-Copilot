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
	ConnectRedis()

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000",
			"https://careercopilot-dinesh.netlify.app",
			"https://career-copilot-three-tau.vercel.app",
			"https://hilarious-kataifi-9685f0.netlify.app",
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
		AllowCredentials: false,
	}))

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "Backend Running",
		})
	})

	// Authentication
	router.POST("/register", Register)
	router.POST("/login", Login)
	router.GET("/profile", AuthMiddleware(), GetProfile)

	// Resume
	router.POST("/resume/upload", AuthMiddleware(), UploadResume)
	router.GET("/resume/latest", AuthMiddleware(), GetLatestResume)
	router.GET("/dashboard", AuthMiddleware(), GetDashboard)

	// Temporarily disabled until helper functions are fixed
	// router.POST("/resume/tailor", AuthMiddleware(), TailorResume)

	// AI Features
	router.GET("/roadmap", AuthMiddleware(), GetCareerRoadmap)
	router.GET("/role-recommendation", AuthMiddleware(), GetRecommendedRole)
	router.POST("/chat", AuthMiddleware(), CareerChat)

	// Jobs
	router.GET("/jobs/recommended", AuthMiddleware(), GetRecommendedJobs)

	// Temporarily disabled old live job routes
	// router.POST("/jobs/fetch-live", AuthMiddleware(), FetchLiveJobs)
	// router.GET("/jobs/live-recommended", AuthMiddleware(), GetLiveRecommendedJobs)
	// router.POST("/jobs/fetch-role-based", AuthMiddleware(), FetchRoleBasedLiveJobs)
	// router.POST("/jobs/refresh-daily", AuthMiddleware(), FetchLiveJobs)

	// Saved Jobs
	router.POST("/saved-jobs", AuthMiddleware(), SaveJob)
	router.GET("/saved-jobs", AuthMiddleware(), GetSavedJobs)
	router.PUT("/saved-jobs/:id/status", AuthMiddleware(), UpdateSavedJobStatus)

	// Applications
	router.POST("/applications", AuthMiddleware(), CreateApplication)
	router.GET("/applications", AuthMiddleware(), GetApplications)
	router.PUT("/applications/:id", AuthMiddleware(), UpdateApplicationStatus)
	router.DELETE("/applications/:id", AuthMiddleware(), DeleteApplication)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	log.Println("🚀 Backend running on port", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
