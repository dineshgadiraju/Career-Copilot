package main

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
)

type ResumeAnalysis struct {
	Filename   string   `json:"filename"`
	Skills     []string `json:"skills"`
	Score      int      `json:"score"`
	TextLength int      `json:"text_length"`
}

func AnalyzeResume(path string) (*ResumeAnalysis, error) {
	file, err := os.Open(path)

	if err != nil {
		return nil, err
	}

	defer file.Close()

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	part, err := writer.CreateFormFile("resume", file.Name())

	if err != nil {
		return nil, err
	}

	_, err = io.Copy(part, file)

	if err != nil {
		return nil, err
	}

	err = writer.Close()

	if err != nil {
		return nil, err
	}

	mlServiceURL := os.Getenv("ML_SERVICE_URL")

	if mlServiceURL == "" {
		mlServiceURL = "http://localhost:8000"
	}

	mlServiceURL = strings.TrimRight(mlServiceURL, "/")

	req, err := http.NewRequest(
		"POST",
		mlServiceURL+"/analyze-resume",
		&body,
	)

	if err != nil {
		return nil, err
	}

	req.Header.Set(
		"Content-Type",
		writer.FormDataContentType(),
	)

	client := &http.Client{}

	resp, err := client.Do(req)

	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	var result ResumeAnalysis

	err = json.NewDecoder(resp.Body).Decode(&result)

	if err != nil {
		return nil, err
	}

	return &result, nil
}
