import os
import shutil
from fastapi import FastAPI, UploadFile, File

from parser import extract_text
from skills import extract_skills
from scoring import calculate_score

app = FastAPI()

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
    }