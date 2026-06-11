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

	router.Run(":8081")
}
