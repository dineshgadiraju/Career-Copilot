package main

import (
	"bytes"
	"encoding/json"
	"fmt"
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

	if _, err = io.Copy(part, file); err != nil {
		return nil, err
	}

	if err = writer.Close(); err != nil {
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

	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ML service request failed: %w", err)
	}
	defer resp.Body.Close()

	rawBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read ML response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("ML service returned status %d: %s", resp.StatusCode, string(rawBody[:min(len(rawBody), 300)]))
	}

	var result ResumeAnalysis

	if err := json.Unmarshal(rawBody, &result); err != nil {
		return nil, fmt.Errorf("ML service returned non-JSON response: %s", string(rawBody[:min(len(rawBody), 300)]))
	}

	return &result, nil
}