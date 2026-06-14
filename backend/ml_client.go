package main

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"os"
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

	part, _ := writer.CreateFormFile("resume", file.Name())
	io.Copy(part, file)

	writer.Close()

	req, _ := http.NewRequest(
		"POST",
		"http://localhost:8000/analyze-resume",
		&body,
	)

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

	return &result, err
}
