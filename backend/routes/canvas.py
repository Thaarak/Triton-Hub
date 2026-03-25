"""
Canvas API Routes Module
Handles Canvas-related API endpoints for fetching courses, assignments, and announcements.
"""
import os
from flask import Blueprint, jsonify, session, request
from canvas_api import fetch_canvas_info


canvas_bp = Blueprint("canvas", __name__)


@canvas_bp.route("/canvas/courses", methods=["GET"])
def get_canvas_courses():
    """
    Fetch all Canvas courses, assignments, and announcements for the authenticated user.
    Returns course data with nested assignments and announcements.
    """
    user_id = session.get("user_id")
    
    print(f"DEBUG /api/canvas/courses: user_id from session = {user_id}")
    
    if not user_id:
        print("ERROR: Not authenticated - no user_id in session")
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        print(f"Fetching Canvas data for user {user_id}...")
        result = fetch_canvas_info(user_id)
        print(f"✅ Successfully fetched {len(result.get('courses', []))} courses")
        return jsonify(result), 200
            
    except ValueError as e:
        print(f"❌ Canvas token error: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"❌ Error fetching Canvas data: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch Canvas data", "details": str(e)}), 500


@canvas_bp.route("/canvas/assignments", methods=["GET"])
def get_canvas_assignments():
    """
    Fetch all assignments from Canvas courses for the authenticated user.
    Returns a flattened list of all assignments across all courses.
    """
    user_id = session.get("user_id")
    
    print(f"DEBUG /api/canvas/assignments: user_id from session = {user_id}")
    
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        result = fetch_canvas_info(user_id)
        courses = result.get("courses", [])
        
        # Flatten all assignments from all courses
        all_assignments = []
        for course in courses:
            course_assignments = course.get("assignments", [])
            for assignment in course_assignments:
                assignment["course_name"] = course.get("name")
                assignment["course_id"] = course.get("id")
                all_assignments.append(assignment)
        
        print(f"✅ Returning {len(all_assignments)} assignments")
        return jsonify({"assignments": all_assignments}), 200
            
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"❌ Error fetching assignments: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch assignments", "details": str(e)}), 500


@canvas_bp.route("/canvas/announcements", methods=["GET"])
def get_canvas_announcements():
    """
    Fetch all announcements from Canvas courses for the authenticated user.
    Returns a flattened list of all announcements across all courses.
    """
    user_id = session.get("user_id")
    
    print(f"DEBUG /api/canvas/announcements: user_id from session = {user_id}")
    
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        result = fetch_canvas_info(user_id)
        courses = result.get("courses", [])
        
        # Flatten all announcements from all courses
        all_announcements = []
        for course in courses:
            course_announcements = course.get("announcements", [])
            for announcement in course_announcements:
                announcement["course_name"] = course.get("name")
                announcement["course_id"] = course.get("id")
                all_announcements.append(announcement)
        
        print(f"✅ Returning {len(all_announcements)} announcements")
        return jsonify({"announcements": all_announcements}), 200
            
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"❌ Error fetching announcements: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch announcements", "details": str(e)}), 500
