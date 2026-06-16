package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type ChatRequest struct {
	Message string `json:"message"`
}

type ChatJobMatch struct {
	Title          string
	Company        string
	RequiredSkills []string
	MatchedSkills  []string
	MissingSkills  []string
	MatchScore     int
}

type OpenAIRequest struct {
	Model           string `json:"model"`
	Instructions    string `json:"instructions"`
	Input           string `json:"input"`
	MaxOutputTokens int    `json:"max_output_tokens"`
}

type OpenAIResponse struct {
	Output []struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	} `json:"output"`
}

func CareerChat(c *gin.Context) {
	userID := c.GetInt("user_id")

	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	skills, score := getLatestResumeData(userID)
	jobMatches := getChatJobMatches(skills)
	missingSkills := collectMissingSkills(jobMatches)

	reply, err := callOpenAICareerCoach(req.Message, skills, score, jobMatches, missingSkills)

	if err != nil {
		reply = buildCareerReply(strings.ToLower(req.Message), skills, score, jobMatches, missingSkills)
	}

	c.JSON(http.StatusOK, gin.H{
		"reply": reply,
	})
}

func callOpenAICareerCoach(
	userMessage string,
	skills []string,
	score int,
	jobMatches []ChatJobMatch,
	missingSkills []string,
) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")

	if apiKey == "" {
		return "", os.ErrNotExist
	}

	contextText := buildAIContext(skills, score, jobMatches, missingSkills)

	requestBody := OpenAIRequest{
		Model:           "gpt-4.1-mini",
		Instructions:    "You are an AI Career Coach. Give practical, concise, personalized advice. Use the user's resume skills, score, missing skills, and job matches. Keep answers friendly and action-oriented.",
		Input:           contextText + "\n\nUser question: " + userMessage,
		MaxOutputTokens: 300,
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

	client := &http.Client{}

	resp, err := client.Do(httpReq)
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

func buildAIContext(
	skills []string,
	score int,
	jobMatches []ChatJobMatch,
	missingSkills []string,
) string {
	bestJob := "No job matches found yet."

	if len(jobMatches) > 0 {
		best := jobMatches[0]
		bestJob = best.Title + " at " + best.Company +
			" with match score " + strconv.Itoa(best.MatchScore) + "%"
	}

	return "Resume score: " + strconv.Itoa(score) + "%\n" +
		"Detected skills: " + strings.Join(skills, ", ") + "\n" +
		"Missing skills: " + strings.Join(missingSkills, ", ") + "\n" +
		"Best job match: " + bestJob
}

func getLatestResumeData(userID int) ([]string, int) {
	var skills []string
	var score int

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT skills, score
		FROM resumes
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
		`,
		userID,
	).Scan(&skills, &score)

	if err != nil {
		return []string{}, 0
	}

	return skills, score
}

func getChatJobMatches(resumeSkills []string) []ChatJobMatch {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT title, company, required_skills
		FROM jobs
		`,
	)

	if err != nil {
		return []ChatJobMatch{}
	}

	defer rows.Close()

	matches := []ChatJobMatch{}

	for rows.Next() {
		var job ChatJobMatch

		err := rows.Scan(
			&job.Title,
			&job.Company,
			&job.RequiredSkills,
		)

		if err != nil {
			continue
		}

		for _, requiredSkill := range job.RequiredSkills {
			if containsChatSkill(resumeSkills, requiredSkill) {
				job.MatchedSkills = append(job.MatchedSkills, requiredSkill)
			} else {
				job.MissingSkills = append(job.MissingSkills, requiredSkill)
			}
		}

		if len(job.RequiredSkills) > 0 {
			job.MatchScore = (len(job.MatchedSkills) * 100) / len(job.RequiredSkills)
		}

		matches = append(matches, job)
	}

	sort.Slice(matches, func(i, j int) bool {
		return matches[i].MatchScore > matches[j].MatchScore
	})

	return matches
}

func collectMissingSkills(jobMatches []ChatJobMatch) []string {
	seen := map[string]bool{}
	missing := []string{}

	for _, job := range jobMatches {
		for _, skill := range job.MissingSkills {
			normalized := strings.ToLower(strings.TrimSpace(skill))

			if !seen[normalized] {
				seen[normalized] = true
				missing = append(missing, skill)
			}
		}
	}

	return missing
}

func buildCareerReply(
	message string,
	skills []string,
	score int,
	jobMatches []ChatJobMatch,
	missingSkills []string,
) string {
	if len(skills) == 0 {
		return "Upload a resume first so I can analyze your skills and give personalized career advice."
	}

	if strings.Contains(message, "resume") || strings.Contains(message, "improve") {
		return "Your current resume score is " + strconv.Itoa(score) + "%. I detected these skills: " +
			strings.Join(skills, ", ") +
			". To improve your resume, add measurable project impact, backend architecture details, API endpoints, database work, Docker usage, and deployment details."
	}

	if strings.Contains(message, "learn") ||
		strings.Contains(message, "skills") ||
		strings.Contains(message, "next") {
		if len(missingSkills) > 0 {
			return "Based on your resume and recommended jobs, you should learn: " +
				strings.Join(missingSkills, ", ") +
				". Start with Docker and PostgreSQL, then move to AWS and Kubernetes."
		}

		return "Your current skills are strong. Next, focus on system design, testing, deployment, cloud platforms, and production-level backend architecture."
	}

	if strings.Contains(message, "job") ||
		strings.Contains(message, "role") ||
		strings.Contains(message, "career") {
		if len(jobMatches) > 0 {
			best := jobMatches[0]

			return "Your best current job match is " + best.Title +
				" at " + best.Company +
				" with a match score of " + strconv.Itoa(best.MatchScore) +
				"%. Matched skills: " + strings.Join(best.MatchedSkills, ", ") +
				". Missing skills: " + strings.Join(best.MissingSkills, ", ") + "."
		}

		return "Target backend developer, Go developer, full-stack developer, and Python ML engineer roles."
	}

	if strings.Contains(message, "interview") {
		return "For backend interviews, practice Go fundamentals, REST APIs, SQL queries, JWT authentication, PostgreSQL, Docker, concurrency, error handling, and system design."
	}

	return "Based on your resume, your detected skills are: " +
		strings.Join(skills, ", ") +
		". Your score is " + strconv.Itoa(score) +
		"%. Ask me what to learn next, how to improve your resume, or what jobs fit you best."
}

func containsChatSkill(skills []string, target string) bool {
	target = strings.ToLower(strings.TrimSpace(target))

	for _, skill := range skills {
		if strings.ToLower(strings.TrimSpace(skill)) == target {
			return true
		}
	}

	return false
}
