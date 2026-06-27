package main

import (
	"context"
	"encoding/json"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type RemotiveResponse struct {
	Jobs []RemotiveJob `json:"jobs"`
}

type RemotiveJob struct {
	ID                        int    `json:"id"`
	Title                     string `json:"title"`
	CompanyName               string `json:"company_name"`
	Category                  string `json:"category"`
	JobType                   string `json:"job_type"`
	CandidateRequiredLocation string `json:"candidate_required_location"`
	URL                       string `json:"url"`
	Description               string `json:"description"`
}

type LiveJobRecommendation struct {
	ID              int      `json:"id"`
	Title           string   `json:"title"`
	Company         string   `json:"company"`
	Location        string   `json:"location"`
	Category        string   `json:"category"`
	JobType         string   `json:"job_type"`
	Source          string   `json:"source"`
	ApplyURL        string   `json:"apply_url"`
	MatchedSkills   []string `json:"matched_skills"`
	MissingSkills   []string `json:"missing_skills"`
	MatchScore      int      `json:"match_score"`
	VisaSponsorship bool     `json:"visa_sponsorship"`
	OPTFriendly     bool     `json:"opt_friendly"`
	STEMOPTFriendly bool     `json:"stem_opt_friendly"`
	USAOnly         bool     `json:"usa_only"`
}

func FetchLiveJobs(c *gin.Context) {
	resp, err := http.Get("https://remotive.com/api/remote-jobs?limit=50")

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch live jobs",
		})
		return
	}

	defer resp.Body.Close()

	var remotiveData RemotiveResponse

	if err := json.NewDecoder(resp.Body).Decode(&remotiveData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to decode live jobs",
		})
		return
	}

	insertedOrSkipped := 0

	for _, job := range remotiveData.Jobs {
		text := job.Title + " " + job.Description + " " + job.CandidateRequiredLocation

		requiredSkills := extractSkillsFromText(text)
		usaOnly := detectUSAJob(job.CandidateRequiredLocation, text)
		visaSponsorship := detectVisaSponsorship(text)
		optFriendly := detectOPTFriendly(text)
		stemOptFriendly := detectSTEMOPTFriendly(text)

		_, _ = DB.Exec(
			context.Background(),
			`
			INSERT INTO live_jobs(
				external_id,
				title,
				company,
				location,
				category,
				job_type,
				source,
				apply_url,
				required_skills,
				visa_sponsorship,
				opt_friendly,
				stem_opt_friendly,
				usa_only
			)
			VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
			ON CONFLICT (external_id) DO UPDATE SET
				title = EXCLUDED.title,
				company = EXCLUDED.company,
				location = EXCLUDED.location,
				category = EXCLUDED.category,
				job_type = EXCLUDED.job_type,
				source = EXCLUDED.source,
				apply_url = EXCLUDED.apply_url,
				required_skills = EXCLUDED.required_skills,
				visa_sponsorship = EXCLUDED.visa_sponsorship,
				opt_friendly = EXCLUDED.opt_friendly,
				stem_opt_friendly = EXCLUDED.stem_opt_friendly,
				usa_only = EXCLUDED.usa_only
			`,
			strconv.Itoa(job.ID),
			job.Title,
			job.CompanyName,
			job.CandidateRequiredLocation,
			job.Category,
			job.JobType,
			"Remotive",
			job.URL,
			requiredSkills,
			visaSponsorship,
			optFriendly,
			stemOptFriendly,
			usaOnly,
		)

		insertedOrSkipped++
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Live jobs fetched successfully",
		"count":   insertedOrSkipped,
	})
}

func GetLiveRecommendedJobs(c *gin.Context) {
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

	rows, err := DB.Query(
		context.Background(),
		`
	SELECT
		id,
		title,
		company,
		location,
		category,
		job_type,
		source,
		apply_url,
		required_skills,
		visa_sponsorship,
		opt_friendly,
		stem_opt_friendly,
		usa_only
	FROM live_jobs
	WHERE usa_only = TRUE
	ORDER BY created_at DESC
	LIMIT 100
	`,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch live job recommendations",
		})
		return
	}

	defer rows.Close()

	recommendations := []LiveJobRecommendation{}

	for rows.Next() {
		var job LiveJobRecommendation
		var requiredSkills []string

		err := rows.Scan(
			&job.ID,
			&job.Title,
			&job.Company,
			&job.Location,
			&job.Category,
			&job.JobType,
			&job.Source,
			&job.ApplyURL,
			&requiredSkills,
			&job.VisaSponsorship,
			&job.OPTFriendly,
			&job.STEMOPTFriendly,
			&job.USAOnly,
		)

		if err != nil {
			continue
		}

		for _, skill := range requiredSkills {
			if containsSkill(resumeSkills, skill) {
				job.MatchedSkills = append(job.MatchedSkills, skill)
			} else {
				job.MissingSkills = append(job.MissingSkills, skill)
			}
		}

		if len(requiredSkills) > 0 {
			job.MatchScore = (len(job.MatchedSkills) * 100) / len(requiredSkills)
		}

		recommendations = append(recommendations, job)
	}

	sort.Slice(recommendations, func(i, j int) bool {
		if recommendations[i].VisaSponsorship != recommendations[j].VisaSponsorship {
			return recommendations[i].VisaSponsorship
		}

		if recommendations[i].STEMOPTFriendly != recommendations[j].STEMOPTFriendly {
			return recommendations[i].STEMOPTFriendly
		}

		if recommendations[i].OPTFriendly != recommendations[j].OPTFriendly {
			return recommendations[i].OPTFriendly
		}

		return recommendations[i].MatchScore > recommendations[j].MatchScore
	})

	c.JSON(http.StatusOK, gin.H{
		"jobs": recommendations,
	})
}

func extractSkillsFromText(text string) []string {
	text = strings.ToLower(text)

	knownSkills := []string{
		"go",
		"golang",
		"python",
		"java",
		"javascript",
		"typescript",
		"react",
		"next.js",
		"node",
		"node.js",
		"sql",
		"postgresql",
		"mysql",
		"mongodb",
		"docker",
		"kubernetes",
		"aws",
		"azure",
		"gcp",
		"linux",
		"api",
		"rest",
		"graphql",
		"machine learning",
		"fastapi",
		"redis",
		"ci/cd",
		"github",
	}

	skills := []string{}

	for _, skill := range knownSkills {
		if strings.Contains(text, skill) {
			skills = append(skills, skill)
		}
	}

	return skills
}

func detectUSAJob(location string, text string) bool {
	location = strings.ToLower(location)
	text = strings.ToLower(text)

	usaKeywords := []string{
		"usa",
		"united states",
		"us only",
		"u.s.",
		"u.s.a",
		"america",
		"north america",
		"remote us",
		"remote - us",
		"remote (us)",
	}

	for _, keyword := range usaKeywords {
		if strings.Contains(location, keyword) || strings.Contains(text, keyword) {
			return true
		}
	}

	return false
}

func detectVisaSponsorship(text string) bool {
	text = strings.ToLower(text)

	positiveKeywords := []string{
		"visa sponsorship",
		"sponsorship available",
		"will sponsor",
		"we sponsor",
		"h1b sponsorship",
		"h-1b sponsorship",
		"employment sponsorship",
		"work authorization sponsorship",
		"sponsor work visa",
	}

	negativeKeywords := []string{
		"no visa sponsorship",
		"not sponsor",
		"does not sponsor",
		"do not sponsor",
		"cannot sponsor",
		"unable to sponsor",
		"without sponsorship",
		"must be authorized to work in the united states",
		"must be legally authorized to work",
	}

	for _, keyword := range negativeKeywords {
		if strings.Contains(text, keyword) {
			return false
		}
	}

	for _, keyword := range positiveKeywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}

	return false
}

func detectOPTFriendly(text string) bool {
	text = strings.ToLower(text)

	keywords := []string{
		"opt",
		"f-1",
		"f1",
		"international students",
		"optional practical training",
	}

	for _, keyword := range keywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}

	return false
}

func detectSTEMOPTFriendly(text string) bool {
	text = strings.ToLower(text)

	keywords := []string{
		"stem opt",
		"stem extension",
		"24-month extension",
		"e-verify",
		"everify",
	}

	for _, keyword := range keywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}

	return false
}
