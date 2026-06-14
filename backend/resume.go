package main

import (
	"context"
	"fmt"
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

	analysis, err := AnalyzeResume(savePath)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to analyze resume: " + err.Error(),
		})
		return
	}

	userID := c.GetInt("user_id")

	fmt.Println("========== DEBUG ==========")
	fmt.Println("userID:", userID)
	fmt.Println("filename:", analysis.Filename)
	fmt.Println("score:", analysis.Score)
	fmt.Println("skills:", analysis.Skills)
	fmt.Println("===========================")

	_, err = DB.Exec(
		context.Background(),
		`
		INSERT INTO resumes(user_id, filename, score, skills)
		VALUES($1,$2,$3,$4)
		`,
		userID,
		analysis.Filename,
		analysis.Score,
		analysis.Skills,
	)

	if err != nil {
		fmt.Println("DB INSERT ERROR:", err)

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Resume uploaded successfully",
		"analysis": analysis,
	})
}
