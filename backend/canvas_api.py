from canvasapi import Canvas

API_URL = "https://canvas.ucsd.edu"


def get_api_key(user_id):
    """Fetch the user's Canvas API key from the database."""
    import os
    from supabase import create_client
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    supabase = create_client(supabase_url, supabase_key)
    
    res = supabase.table("profiles").select("canvas_token").eq("id", user_id).execute()
    if res.data and len(res.data) > 0:
        return res.data[0].get("canvas_token")
    return None


def fetch_canvas_info(user_id):
    api_key = get_api_key(user_id)
    canvas = Canvas(API_URL, api_key)

    courses = []
    for course in canvas.get_courses(enrollment_state="active"):
        if "WI26" not in course.name:
            continue

        enrollments = course.get_enrollments(type=["StudentEnrollment"], user_id="self")
        current_grade = None
        for enrollment in enrollments:
            grades = enrollment.grades
            current_grade = {
                "current_score": grades.get("current_score"),
                "current_grade": grades.get("current_grade"),
                "final_score": grades.get("final_score"),
                "final_grade": grades.get("final_grade"),
            }

        course_data = {
            "id": course.id,
            "name": course.name,
            "grades": current_grade,
            "assignments": [],
            "announcements": [],
        }

        for assignment in course.get_assignments():
            course_data["assignments"].append({
                "id": assignment.id,
                "name": assignment.name,
                "due_at": assignment.due_at,
                "description": assignment.description,
                "points_possible": assignment.points_possible,
            })

        for announcement in canvas.get_announcements([course.id]):
            course_data["announcements"].append({
                "id": announcement.id,
                "title": announcement.title,
                "message": announcement.message,
                "posted_at": announcement.posted_at,
            })

        courses.append(course_data)

    return {"courses": courses}
