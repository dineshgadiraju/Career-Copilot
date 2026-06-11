package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetProfile(c *gin.Context) {

	userID, _ := c.Get("user_id")
	email, _ := c.Get("email")

	c.JSON(http.StatusOK, gin.H{
		"user_id": userID,
		"email":   email,
	})
}
