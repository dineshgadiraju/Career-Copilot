package main

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func UploadResume(c *gin.Context) {

	file, err := c.FormFile("resume")

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Resume file required",
		})
		return
	}

	err = os.MkdirAll("../uploads", os.ModePerm)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	savePath := filepath.Join(
		"../uploads",
		file.Filename,
	)

	err = c.SaveUploadedFile(
		file,
		savePath,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Resume uploaded successfully",
		"file":    file.Filename,
	})
}
