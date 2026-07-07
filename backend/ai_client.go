package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
)

func CallOpenAI(instructions string, input string, maxTokens int) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")

	if apiKey == "" {
		return "", os.ErrNotExist
	}

	requestBody := OpenAIRequest{
		Model:           "gpt-4.1-mini",
		Instructions:    instructions,
		Input:           input,
		MaxOutputTokens: maxTokens,
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequest(
		"POST",
		"https://api.openai.com/v1/responses",
		bytes.NewBuffer(jsonBody),
	)
	if err != nil {
		return "", err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var openAIResp OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		return "", err
	}

	if len(openAIResp.Output) == 0 ||
		len(openAIResp.Output[0].Content) == 0 ||
		openAIResp.Output[0].Content[0].Text == "" {
		return "", os.ErrInvalid
	}

	return openAIResp.Output[0].Content[0].Text, nil
}
