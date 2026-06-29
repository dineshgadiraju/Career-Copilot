# 🚀 AI Career Copilot

An AI-powered full-stack career platform that helps software engineers improve their resumes, discover career opportunities, receive personalized learning roadmaps, and prepare for their next job.

Built using **Next.js**, **Go**, **FastAPI**, **PostgreSQL**, and deployed on **Vercel** and **Render** with automated **GitHub Actions CI**.

---

# 🌐 Live Demo

**Frontend**

https://career-copilot-three-tau.vercel.app/

**Backend Health Check**

https://ai-career-copilot-backend-yzm9.onrender.com/health

---

# ✨ Features

### 👤 Authentication

* User Registration
* User Login
* JWT Authentication
* Protected API Routes

---

### 📄 Resume Intelligence

* Upload PDF Resume
* AI Resume Parsing
* Resume Score Generation
* Technical Skill Extraction
* Resume Storage
* Resume Dashboard

---

### 🎯 Career Guidance

* Personalized Role Recommendation
* AI Career Roadmap
* Career Progress Dashboard
* Skill Gap Identification

---

### 🤖 AI Career Coach

* Ask career-related questions
* Resume improvement suggestions
* Technical learning guidance

---

### 💼 Job Matching

* Live Job Recommendation Engine
* Resume-Based Job Matching
* Saved Jobs
* USA Job Filtering (Work in Progress)

---

# 🏗️ System Architecture

```text
                         Internet
                             │
                             ▼
                    Vercel (Frontend)
                       Next.js + React
                             │
                 REST API (HTTPS)
                             │
                             ▼
                  Render (Go Backend API)
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
 PostgreSQL (Neon)                    FastAPI ML Service
 User Data                            Resume Analysis
 Authentication                       Skill Extraction
 Saved Jobs                           Resume Scoring
 Roadmaps                             AI Recommendations
```

---

# 🛠️ Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

---

## Backend

* Go
* Gin Framework
* JWT Authentication
* REST APIs
* PostgreSQL

---

## AI / ML

* Python
* FastAPI
* PyMuPDF
* Resume Skill Extraction

---

## Database

* PostgreSQL (Neon)

---

## Cloud & DevOps

* Vercel
* Render
* GitHub Actions
* Git
* CI Pipeline

---

# 📂 Project Structure

```
Career-Copilot/

├── frontend/          Next.js Frontend
├── backend/           Go Backend API
├── ml-service/        FastAPI ML Service
├── .github/
│      └── workflows/
│             └── ci.yml
│
└── README.md
```

---

# 🔄 CI/CD Pipeline

Every push to the **master** branch automatically triggers GitHub Actions.

The workflow performs:

* Build Next.js Frontend
* Compile Go Backend
* Validate FastAPI ML Service
* Verify dependencies
* Ensure the project builds successfully before deployment

Deployment is automatically handled by:

* **Frontend:** Vercel
* **Backend:** Render
* **AI Service:** Render

---

# 🔐 Authentication Flow

```
User Login
      │
      ▼
Go Backend
      │
Generate JWT
      │
      ▼
Frontend Stores Token
      │
      ▼
Protected API Requests
```

---

# 📈 Resume Analysis Flow

```
Upload Resume
      │
      ▼
Go Backend
      │
      ▼
FastAPI ML Service
      │
      ├── Extract Text
      ├── Extract Skills
      ├── Generate Resume Score
      │
      ▼
PostgreSQL
      │
      ▼
Dashboard
```

---

# 📊 Database

Main tables include:

* users
* resumes
* live_jobs
* saved_jobs

---

# 🚀 Local Development

## Clone Repository

```bash
git clone https://github.com/dineshgadiraju/Career-Copilot.git
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## Backend

```bash
cd backend

go run .
```

---

## ML Service

```bash
cd ml-service

pip install -r requirements.txt

uvicorn main:app --reload
```

---

# 🎯 Future Improvements

* Multi-source USA job aggregation

  * Greenhouse
  * Lever
  * Ashby
  * RemoteOK

* AI Resume Tailoring

* Semantic Resume-to-Job Matching

* Interview Question Generator

* Application Tracking Dashboard

* Docker Compose Deployment

* Kubernetes Deployment

* AWS Infrastructure

* Redis Caching

* Background Workers

---

# 💡 Engineering Decisions

* Go was chosen for its performance, simplicity, and concurrency support.
* FastAPI powers the AI resume analysis service separately from the backend to keep responsibilities isolated.
* PostgreSQL provides reliable relational storage for users, resumes, and job data.
* GitHub Actions validates every code change before deployment.
* Vercel and Render provide automated cloud deployments for frontend and backend services.

---

# 📚 Skills Demonstrated

* Full Stack Development
* REST API Design
* Authentication & Authorization
* Cloud Deployment
* CI/CD
* Database Design
* AI Integration
* Resume Parsing
* Backend Development
* Frontend Development
* PostgreSQL
* FastAPI
* Go
* Next.js
* TypeScript
* Tailwind CSS

---

# 👨‍💻 Author

**Dinesh Venkata Gadiraju**

Master's in Computer Science

University of North Texas

GitHub: https://github.com/dineshgadiraju

---

⭐ If you found this project interesting, consider giving it a star!
