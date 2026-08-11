USE gmu_events;

-- Insert alice if not exists
INSERT INTO users (usn_or_emp_id, full_name, password, system_role, department) 
SELECT 'alice', 'Alice', '$2y$10$0L56XZXxw6kZlCsDED5noee1JjU8l9UjZnTo1uIo5Y9HmUBDB9Rpe', 'faculty', 'AIML'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE usn_or_emp_id = 'alice');

SET @alice_id = (SELECT id FROM users WHERE usn_or_emp_id = 'alice' LIMIT 1);

-- Insert the AI Summit event
INSERT INTO event_registrations (
    EVENT_ID, event_title, description, event_date, category, event_scale, event_mode, 
    proposed_by_id, current_status, budget, brochure_file_path, immediate_approval, 
    approval_route, approval_step, max_participants, max_volunteers, max_coordinators, 
    ROLE, approval_history_json, details_json, registration_deadline, event_time, venue, IS_ADMIN_POST
) VALUES (
    NULL, 
    'AI Summit 2026', 
    'Join us for the biggest AI Summit of the year! Learn about cutting-edge machine learning techniques, AI ethics, and the future of artificial intelligence in various industries. We will have guest speakers from top tech companies.', 
    '2026-10-15', 
    'Academic', 
    'department', 
    'offline', 
    @alice_id, 
    'published', 
    5000.00, 
    'uploads/sample_brochure.pdf', 
    0, 
    '["hod"]', 
    1, 
    300, 
    20, 
    5, 
    'organiser', 
    '[{"step":"hod","status":"approved","remarks":"Looks great, approved.","date":"2026-08-01T12:00:00Z","actor_username":"hod_aiml"}]', 
    '{"is_festival":true,"sub_events":[{"name":"Keynote Speech","description":"Opening address by AI pioneer."},{"name":"Workshop 1: Neural Networks","description":"Hands-on workshop on building your first neural net."}],"sub_events_logistics":[{"name":"Keynote Speech","description":"Opening address by AI pioneer.","venue":"Main Auditorium","start_time":"10:00","end_time":"12:00"},{"name":"Workshop 1: Neural Networks","description":"Hands-on workshop on building your first neural net.","venue":"Lab 1","start_time":"13:00","end_time":"15:00"}]}', 
    '2026-10-10',
    '10:00:00',
    'Main Auditorium',
    1
);
