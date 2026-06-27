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
	Title              string
	Company            string
	Location           string
	ApplyURL           string
	RequiredSkills     []string
	MatchedSkills      []string
	MissingSkills      []string
	MatchScore         int
	VisaSponsorship    bool
	OPTFriendly        bool
	STEMOPTFriendly    bool
	USAOnly            bool
	IsLive             bool
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
	staticMatches := getChatJobMatches(skills)
	liveMatches := getChatLiveJobMatches(skills)
	allMatches := append(staticMatches, liveMatches...)
	sortChatMatches(allMatches)

	missingSkills := collectMissingSkills(allMatches)
	targetRole := detectTargetRole(skills)
	roadmapMissing := getRoadmapMissingSkills(skills, targetRole)

	reply, err := callOpenAICareerCoach(
		req.Message,
		skills,
		score,
		allMatches,
		missingSkills,
		targetRole,
		roadmapMissing,
	)

	if err != nil {
		reply = buildCareerReply(
			strings.ToLower(req.Message),
			skills,
			score,
			allMatches,
			missingSkills,
		)
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
	targetRole string,
	roadmapMissing []string,
) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")

	if apiKey == "" {
		return "", os.ErrNotExist
	}

	contextText := buildAIContext(
		skills,
		score,
		jobMatches,
		missingSkills,
		targetRole,
		roadmapMissing,
	)

	requestBody := OpenAIRequest{
		Model: "gpt-4.1-mini",
		Instructions: "You are an AI Career Coach for software job seekers, especially international students in the US. Give practical, concise, personalized advice using the user's resume skills, score, skill gaps, roadmap, static job matches, live job matches, and F1/OPT/STEM OPT/sponsorship signals. Be honest if sponsorship data is uncertain. Keep answers action-oriented.",
		Input: contextText + "\n\nUser question: " + userMessage,
		MaxOutputTokens: 500,
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
	targetRole string,
	roadmapMissing []string,
) string {
	bestJobs := []string{}

	for i, job := range jobMatches {
		if i >= 5 {
			break
		}

		jobType := "Static"
		if job.IsLive {
			jobType = "Live"
		}

		visaInfo := ""
		if job.USAOnly || job.VisaSponsorship || job.OPTFriendly || job.STEMOPTFriendly {
			visaInfo = " | USA: " + strconv.FormatBool(job.USAOnly) +
				" | Visa sponsorship: " + strconv.FormatBool(job.VisaSponsorship) +
				" | OPT: " + strconv.FormatBool(job.OPTFriendly) +
				" | STEM OPT: " + strconv.FormatBool(job.STEMOPTFriendly)
		}

		bestJobs = append(
			bestJobs,
			jobType+": "+job.Title+" at "+job.Company+
				" | Match: "+strconv.Itoa(job.MatchScore)+"%"+
				" | Matched: "+strings.Join(job.MatchedSkills, ", ")+
				" | Missing: "+strings.Join(job.MissingSkills, ", ")+
				visaInfo,
		)
	}

	if len(bestJobs) == 0 {
		bestJobs = append(bestJobs, "No job matches found yet.")
	}

	return "Resume score: " + strconv.Itoa(score) + "%\n" +
		"Detected skills: " + strings.Join(skills, ", ") + "\n" +
		"Target role: " + targetRole + "\n" +
		"Roadmap missing skills: " + strings.Join(roadmapMissing, ", ") + "\n" +
		"Job-based missing skills: " + strings.Join(missingSkills, ", ") + "\n" +
		"Top job matches:\n" + strings.Join(bestJobs, "\n")
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

		job.IsLive = false
		matches = append(matches, job)
	}

	sortChatMatches(matches)

	return matches
}

func getChatLiveJobMatches(resumeSkills []string) []ChatJobMatch {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT
			title,
			company,
			location,
			apply_url,
			required_skills,
			visa_sponsorship,
			opt_friendly,
			stem_opt_friendly,
			usa_only
		FROM live_jobs
		ORDER BY created_at DESC
		LIMIT 50
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
			&job.Location,
			&job.ApplyURL,
			&job.RequiredSkills,
			&job.VisaSponsorship,
			&job.OPTFriendly,
			&job.STEMOPTFriendly,
			&job.USAOnly,
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

		job.IsLive = true
		matches = append(matches, job)
	}

	sortChatMatches(matches)

	return matches
}

func sortChatMatches(matches []ChatJobMatch) {
	sort.Slice(matches, func(i, j int) bool {
		if matches[i].VisaSponsorship != matches[j].VisaSponsorship {
			return matches[i].VisaSponsorship
		}

		if matches[i].STEMOPTFriendly != matches[j].STEMOPTFriendly {
			return matches[i].STEMOPTFriendly
		}

		if matches[i].OPTFriendly != matches[j].OPTFriendly {
			return matches[i].OPTFriendly
		}

		if matches[i].USAOnly != matches[j].USAOnly {
			return matches[i].USAOnly
		}

		return matches[i].MatchScore > matches[j].MatchScore
	})
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
			". To improve your resume, add measurable project impact, backend architecture details, API endpoints, database work, Docker usage, deployment details, and role-specific keywords from your matched jobs."
	}

	if strings.Contains(message, "learn") ||
		strings.Contains(message, "skills") ||
		strings.Contains(message, "next") {
		if len(missingSkills) > 0 {
			return "Based on your resume and job matches, you should learn: " +
				strings.Join(missingSkills, ", ") +
				". Prioritize skills that appear repeatedly in live job postings and your career roadmap."
		}

		return "Your current skills are strong. Next, focus on system design, testing, deployment, cloud platforms, and production-level backend architecture."
	}

	if strings.Contains(message, "job") ||
		strings.Contains(message, "role") ||
		strings.Contains(message, "career") ||
		strings.Contains(message, "opt") ||
		strings.Contains(message, "visa") ||
		strings.Contains(message, "sponsor") {
		if len(jobMatches) > 0 {
			best := jobMatches[0]

			visaText := ""
			if best.IsLive {
				visaText = " USA: " + strconv.FormatBool(best.USAOnly) +
					", visa sponsorship: " + strconv.FormatBool(best.VisaSponsorship) +
					", OPT: " + strconv.FormatBool(best.OPTFriendly) +
					", STEM OPT: " + strconv.FormatBool(best.STEMOPTFriendly) + "."
			}

			return "Your best current job match is " + best.Title +
				" at " + best.Company +
				" with a match score of " + strconv.Itoa(best.MatchScore) +
				"%. Matched skills: " + strings.Join(best.MatchedSkills, ", ") +
				". Missing skills: " + strings.Join(best.MissingSkills, ", ") +
				"." + visaText
		}

		return "Target backend developer, Go developer, full-stack developer, and Python ML engineer roles. For F1/OPT, focus on US roles that explicitly mention sponsorship, OPT, STEM OPT, E-Verify, or international student eligibility."
	}

	if strings.Contains(message, "interview") {
		return "For backend interviews, practice Go fundamentals, REST APIs, SQL queries, JWT authentication, PostgreSQL, Docker, concurrency, error handling, system design, and explaining this AI Career Copilot project end-to-end."
	}

	return "Based on your resume, your detected skills are: " +
		strings.Join(skills, ", ") +
		". Your score is " + strconv.Itoa(score) +
		"%. Ask me what to learn next, how to improve your resume, what jobs fit you best, or how to target F1/OPT-friendly roles."
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