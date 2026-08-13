import mysql.connector
import random

db_config = {
    'user': 'root',
    'password': 'dhanashreessql2025',
    'host': 'localhost',
    'database': 'GMU_Events01'
}

def run():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # 1. Get all completed events
        cursor.execute("SELECT SL_NO FROM event_master WHERE CURRENT_STATUS = 'completed'")
        completed_events = [row['SL_NO'] for row in cursor.fetchall()]

        if not completed_events:
            print("No completed events found.")
            return

        print(f"Found completed events: {completed_events}")

        # 2. Update event_metadata with dummy reports
        dummy_report_text = "This event was executed successfully. All sub-events concluded on time, and participant feedback was overwhelmingly positive. Budget utilization was optimal, and the final outcomes exceeded the initial objectives."
        dummy_pdf_path = "dummy_report.pdf"

        for event_id in completed_events:
            cursor.execute("""
                UPDATE event_metadata 
                SET POST_EVENT_REPORT = %s, REPORT_PDF_PATH = %s 
                WHERE EVENT_ID = %s
            """, (dummy_report_text, dummy_pdf_path, event_id))
            print(f"Updated metadata for event {event_id}")

        # 3. Add dummy registrations and feedback
        dummy_students = ['GMBCAT01', 'GMBCDA01', 'GMBCAI01', 'GMCS01']
        
        comments_list = [
            "Great event, learned a lot!",
            "Well organized and very informative.",
            "The sessions were a bit long but overall good.",
            "Amazing experience, looking forward to the next one.",
            "Good speakers and relevant topics.",
            "Could have had better catering, but the content was top-notch."
        ]

        for event_id in completed_events:
            for student in dummy_students:
                # Check if registration exists
                cursor.execute("SELECT ID FROM event_registrations WHERE EVENT_ID = %s AND STUDENT_ID = %s", (event_id, student))
                reg = cursor.fetchone()

                rating = random.randint(3, 5)
                comment = random.choice(comments_list)

                if reg:
                    # Update existing registration
                    cursor.execute("""
                        UPDATE event_registrations 
                        SET FEEDBACK_RATING = %s, FEEDBACK_COMMENTS = %s, attendance_status = 'Attended', attended = 1, CHECK_IN_STATUS = 'checked_in'
                        WHERE ID = %s
                    """, (rating, comment, reg['ID']))
                else:
                    # Insert new registration
                    cursor.execute("""
                        INSERT INTO event_registrations 
                        (STUDENT_ID, EVENT_ID, STATUS, ROLE, FEEDBACK_RATING, FEEDBACK_COMMENTS, attendance_status, attended, CHECK_IN_STATUS)
                        VALUES (%s, %s, 'active', 'participant', %s, %s, 'Attended', 1, 'checked_in')
                    """, (student, event_id, rating, comment))
            print(f"Added feedback for event {event_id}")

        conn.commit()
        print("Successfully generated dummy data.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    run()
