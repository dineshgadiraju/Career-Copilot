SKILLS = [
    "python",
    "golang",
    "go",
    "docker",
    "postgresql",
    "react",
    "javascript",
    "sql",
    "aws",
    "kubernetes",
    "machine learning",
]

def extract_skills(text):

    text = text.lower()

    found = []

    for skill in SKILLS:
        if skill in text:
            found.append(skill)

    return list(set(found))