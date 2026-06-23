package main

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type CareerRoadmap struct {
	TargetRole      string   `json:"target_role"`
	CurrentSkills   []string `json:"current_skills"`
	MissingSkills   []string `json:"missing_skills"`
	Roadmap         []string `json:"roadmap"`
	ProjectIdeas    []string `json:"project_ideas"`
	InterviewTopics []string `json:"interview_topics"`
}

func GetCareerRoadmap(c *gin.Context) {
	userID := c.GetInt("user_id")

	var resumeSkills []string

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT skills
		FROM resumes
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
		`,
		userID,
	).Scan(&resumeSkills)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No resume found",
		})
		return
	}

	targetRole := detectTargetRole(resumeSkills)
	missingSkills := getRoadmapMissingSkills(resumeSkills, targetRole)

	roadmap := CareerRoadmap{
		TargetRole:      targetRole,
		CurrentSkills:   resumeSkills,
		MissingSkills:   missingSkills,
		Roadmap:         buildRoadmap(targetRole, missingSkills),
		ProjectIdeas:    buildProjectIdeas(targetRole),
		InterviewTopics: buildInterviewTopics(targetRole),
	}

	c.JSON(http.StatusOK, roadmap)
}

func detectTargetRole(skills []string) string {
	hasGo := hasSkill(skills, "go") || hasSkill(skills, "golang")
	hasPython := hasSkill(skills, "python")
	hasReact := hasSkill(skills, "react") || hasSkill(skills, "next.js")

	if hasGo {
		return "Go Backend Engineer"
	}

	if hasPython {
		return "Python / AI Engineer"
	}

	if hasReact {
		return "Full Stack Developer"
	}

	return "Backend Software Engineer"
}

func getRoadmapMissingSkills(skills []string, targetRole string) []string {
	roleSkills := map[string][]string{
		"Go Backend Engineer": {
			"PostgreSQL",
			"Docker",
			"AWS",
			"Redis",
			"Kubernetes",
			"System Design",
			"Testing",
			"CI/CD",
		},
		"Python / AI Engineer": {
			"FastAPI",
			"Machine Learning",
			"PostgreSQL",
			"Docker",
			"AWS",
			"Vector Databases",
			"LLM APIs",
			"Model Deployment",
		},
		"Full Stack Developer": {
			"React",
			"Next.js",
			"TypeScript",
			"Node.js",
			"PostgreSQL",
			"Docker",
			"AWS",
			"Testing",
		},
		"Backend Software Engineer": {
			"Go",
			"PostgreSQL",
			"Docker",
			"REST APIs",
			"AWS",
			"Redis",
			"System Design",
			"Testing",
		},
	}

	required := roleSkills[targetRole]
	missing := []string{}

	for _, skill := range required {
		if !hasSkill(skills, skill) {
			missing = append(missing, skill)
		}
	}

	return missing
}

func buildRoadmap(targetRole string, missingSkills []string) []string {
	roadmap := []string{
		"Week 1-2: Strengthen core backend fundamentals, REST APIs, authentication, and database design.",
		"Week 3-4: Build one production-style project using your target backend stack.",
		"Week 5-6: Add Docker, testing, logging, error handling, and deployment.",
		"Week 7-8: Learn cloud deployment, CI/CD, and monitoring basics.",
		"Week 9-10: Practice system design and scalability concepts.",
		"Week 11-12: Prepare interview stories, resume bullets, and deploy your best project publicly.",
	}

	if len(missingSkills) > 0 {
		roadmap = append(
			roadmap,
			"Priority skills to learn first: "+strings.Join(missingSkills[:min(4, len(missingSkills))], ", ")+".",
		)
	}

	return roadmap
}

func buildProjectIdeas(targetRole string) []string {
	switch targetRole {
	case "Go Backend Engineer":
		return []string{
			"Build a Go REST API with JWT authentication, PostgreSQL, Docker, and Redis caching.",
			"Create a job tracking backend with saved jobs, application status, and analytics.",
			"Build a URL shortener or task manager with rate limiting and background workers.",
		}
	case "Python / AI Engineer":
		return []string{
			"Build an AI resume analyzer using FastAPI, OpenAI, and PostgreSQL.",
			"Create a document Q&A app using embeddings and vector search.",
			"Deploy an ML-powered recommendation API with Docker.",
		}
	default:
		return []string{
			"Build a full-stack dashboard with authentication, database storage, and API integration.",
			"Create a job recommendation platform with resume upload and skill matching.",
			"Build a portfolio project with deployment, testing, and clean documentation.",
		}
	}
}

func buildInterviewTopics(targetRole string) []string {
	return []string{
		"REST API design",
		"SQL queries and indexing",
		"Authentication and JWT",
		"Docker basics",
		"Error handling",
		"System design fundamentals",
		"Project explanation end-to-end",
	}
}

func hasSkill(skills []string, target string) bool {
	target = strings.ToLower(strings.TrimSpace(target))

	for _, skill := range skills {
		if strings.ToLower(strings.TrimSpace(skill)) == target {
			return true
		}
	}

	return false
}

func min(a int, b int) int {
	if a < b {
		return a
	}

	return b
}
