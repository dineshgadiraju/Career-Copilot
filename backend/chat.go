package main

import (
	"context"
	"net/http"
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

func CareerChat(c *gin.Context) {
	userID := c.GetInt("user_id")

	var req ChatRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request",
		})
		return
	}

	message := strings.ToLower(req.Message)

	skills, score := getLatestResumeData(userID)
	jobMatches := getChatJobMatches(skills)
	missingSkills := collectMissingSkills(jobMatches)

	reply := buildCareerReply(message, skills, score, jobMatches, missingSkills)

	c.JSON(http.StatusOK, gin.H{
		"reply": reply,
	})
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
			". To improve your resume, add measurable project impact, describe backend architecture, mention API endpoints, database design, authentication, Docker usage, and deployment details."
	}

	if strings.Contains(message, "learn") ||
		strings.Contains(message, "skills") ||
		strings.Contains(message, "next") {
		if len(missingSkills) > 0 {
			return "Based on your resume and recommended jobs, you should learn: " +
				strings.Join(missingSkills, ", ") +
				". Start with Docker and PostgreSQL if you want backend roles, then move to AWS and Kubernetes."
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

		return "Based on your current profile, target backend developer, Go developer, full-stack developer, and Python ML engineer roles."
	}

	if strings.Contains(message, "interview") {
		return "For backend interviews, practice Go fundamentals, REST APIs, SQL queries, JWT authentication, PostgreSQL, Docker, concurrency, error handling, and system design. Also be ready to explain your AI Career Copilot project end-to-end."
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