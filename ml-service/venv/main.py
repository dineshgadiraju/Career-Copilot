from fastapi import FastAPI, UploadFile, File
import os

from parser import extract_text
from skills import extract_skills

app = FastAPI()


@app.get("/")
def root():
    return {
        "message": "Welcome to AI Career Copilot ML Service"
    }


@app.get("/health")
def health():
    return {
        "status": "ML Service Running"
    }


@app.post("/analyze-resume")
async def analyze_resume(
    resume: UploadFile = File(...)
):

    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(
        upload_dir,
        resume.filename,
    )

    with open(file_path, "wb") as buffer:
        buffer.write(await resume.read())

    text = extract_text(file_path)

    skills = extract_skills(text)

    return {
        "filename": resume.filename,
        "skills": skills,
        "text_length": len(text),
    }