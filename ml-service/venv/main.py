from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Welcome to AI Career Copilot ML Service"}

@app.get("/health")
def health():
    return {"status": "ML Service Running"}