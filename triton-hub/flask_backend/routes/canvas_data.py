from flask import Blueprint, jsonify, session
from datetime import datetime
import os

canvas_data = Blueprint("canvas_data", __name__)

try:
    from canvasapi import Canvas
except ImportError:
    Canvas = None


@canvas_data.route("/get-token")
@canvas_data.route("/get-token/")
def get_canvas_token():
    """Return the canvas token from session for frontend use"""
    if "user_info" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    if "canvas_token" not in session:
        return jsonify({"error": "Canvas token not configured"}), 401
    
    return jsonify({"canvas_token": session["canvas_token"]})


@canvas_data.route("/fetch")
@canvas_data.route("/fetch/")
def fetch_canvas_data():
    """Fetch Canvas assignments and announcements"""
    if "user_info" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    if "canvas_token" not in session:
        return jsonify({"error": "Canvas token not configured"}), 401
    
    if Canvas is None:
        return jsonify({"error": "canvasapi library not installed"}), 500
    
    canvas_token = session["canvas_token"]
    domain = "https://canvas.ucsd.edu"
    
    try:
        canvas = Canvas(domain, canvas_token)
        
        # Fetch active courses for Winter 2026
        print("Fetching courses...")
        courses = []
        for course in canvas.get_courses(enrollment_state="active"):
            if hasattr(course, 'name') and "WI26" in course.name:
                courses.append(course)
        
        all_notifications = []
        
        # Fetch assignments for each course
        print("Fetching assignments...")
        for course in courses:
            course_name = course.name if hasattr(course, 'name') else 'Unknown Course'
            course_id = course.id if hasattr(course, 'id') else None
            
            if not course_id:
                continue
            
            try:
                for assignment in course.get_assignments():
                    due_at = assignment.due_at if hasattr(assignment, 'due_at') else None
                    if not due_at:
                        continue
                        
                    try:
                        # Parse ISO format datetime
                        dt = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
                        event_date = dt.strftime("%Y-%m-%d")
                        event_time = dt.strftime("%I:%M %p")
                    except:
                        event_date = str(due_at)
                        event_time = ""
                    
                    assignment_name = assignment.name if hasattr(assignment, 'name') else 'Assignment'
                    html_url = assignment.html_url if hasattr(assignment, 'html_url') else ""
                    
                    notif = {
                        "source": "Canvas",
                        "category": "assignment",
                        "event_date": event_date,
                        "event_time": event_time,
                        "urgency": "High",
                        "link": html_url,
                        "summary": f"[{course_name}] {assignment_name} is due.",
                        "course_name": course_name,
                        "course_id": course_id
                    }
                    all_notifications.append(notif)
            except Exception as e:
                print(f"Warning: Could not fetch assignments for {course_name}: {e}")
                continue
        
        # Fetch announcements
        print("Fetching announcements...")
        try:
            course_ids = [c.id for c in courses if hasattr(c, 'id')]
            for announcement in canvas.get_announcements(course_ids):
                posted_at = announcement.posted_at if hasattr(announcement, 'posted_at') else None
                
                try:
                    if posted_at:
                        dt = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
                        event_date = dt.strftime("%Y-%m-%d")
                        event_time = dt.strftime("%I:%M %p")
                    else:
                        event_date = None
                        event_time = None
                except:
                    event_date = None
                    event_time = None
                
                title = announcement.title if hasattr(announcement, 'title') else 'Announcement'
                html_url = announcement.html_url if hasattr(announcement, 'html_url') else ""
                
                notif = {
                    "source": "Canvas",
                    "category": "announcement",
                    "event_date": event_date,
                    "event_time": event_time,
                    "urgency": "Medium",
                    "link": html_url,
                    "summary": f"Canvas Announcement: {title}",
                    "title": title
                }
                all_notifications.append(notif)
        except Exception as e:
            print(f"Warning: Could not fetch announcements: {e}")
        
        return jsonify({
            "success": True,
            "count": len(all_notifications),
            "notifications": all_notifications
        })
        
    except Exception as e:
        print(f"Error fetching Canvas data: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
