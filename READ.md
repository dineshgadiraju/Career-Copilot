# AI Career Copilot

AI Career Copilot is a full-stack AI-powered career assistant that analyzes resumes, extracts skills, recommends jobs, and displays a personalized dashboard.

## Tech Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS

### Backend
- Go
- Gin
- JWT Authentication
- PostgreSQL

### ML Service
- Python
- FastAPI
- PyMuPDF
- Skill Extraction

### Infrastructure
- Docker
- Docker Compose
- PostgreSQL

## Features

- User registration
- User login
- JWT authentication
- Protected routes
- Resume upload
- PDF resume parsing
- Skill extraction
- Resume analysis storage
- Dashboard API
- Job recommendation API
- Next.js dashboard UI

## Architecture

```text
Next.js Frontend
        |
        v
Go Backend API
        |
        +---- PostgreSQL
        |
        +---- FastAPI ML Service