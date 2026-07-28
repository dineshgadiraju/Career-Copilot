import os
import shutil
import json
from fastapi import FastAPI, UploadFile, File

from parser import extract_text
from skills import extract_skills
from scoring import calculate_score
from pydantic import BaseModel
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

app = FastAPI()
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-flash-latest")
class ResumeRequest(BaseModel):
    resume_text: str


@app.get("/")
def root():
    return {"message": "Welcome to AI Career Copilot ML Service"}


@app.get("/health")
def health():
    return {"status": "ML Service Running"}


@app.post("/analyze-resume")
async def analyze_resume(resume: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)

    file_path = os.path.join("uploads", resume.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(resume.file, buffer)

    text = extract_text(file_path)
    skills = extract_skills(text)
    score = calculate_score(skills, len(text))

    return {
    "filename": resume.filename,
    "skills": skills,
    "score": score,
    "text_length": len(text),
    "resume_text": text,
}

@app.post("/recommend-role")
async def recommend_role(request: ResumeRequest):
    try:
        prompt = f"""
You are an expert technical recruiter.

Analyze the following resume.

Return ONLY valid JSON.

Example:

{{
    "roles": [
        "Backend Golang Engineer",
        "Software Engineer",
        "Platform Engineer"
    ]
}}

Resume:

{request.resume_text}
"""

        response = model.generate_content(prompt)

        data = json.loads(response.text)

        return data

    except Exception as e:
        return {
            "error": str(e)
        }