def calculate_score(skills, text_length):
    score = 0

    # Skill score: max 60 points
    skill_score = min(len(skills) * 10, 60)
    score += skill_score

    # Resume content length score: max 20 points
    if text_length > 2500:
        score += 20
    elif text_length > 1500:
        score += 15
    elif text_length > 800:
        score += 10
    else:
        score += 5

    # Bonus for strong backend/ML skills: max 20 points
    bonus_skills = ["go", "python", "sql", "docker", "postgresql", "machine learning"]
    bonus = 0

    for skill in skills:
        if skill.lower() in bonus_skills:
            bonus += 5

    score += min(bonus, 20)

    return min(score, 100)