USE GMU_Events01;

SET @fac_cse_id = (SELECT id FROM users WHERE usn_or_emp_id = 'FAC_CSE' LIMIT 1);
SET @hod_cse_id = (SELECT id FROM users WHERE usn_or_emp_id = 'HOD_CSE' LIMIT 1);
SET @dir_sa_id = (SELECT id FROM users WHERE usn_or_emp_id = 'DIRSA001' LIMIT 1);
SET @fac_cse_id = IFNULL(@fac_cse_id, 39);
SET @hod_cse_id = IFNULL(@hod_cse_id, 38);
SET @dir_sa_id = IFNULL(@dir_sa_id, 3);

-- Event 1: Completed
INSERT INTO event_master (EVENT_ID, DEPARTMENT, CATEGORY, TYPE, MODE, EVENT, DESCRIPTION, START_DATE, END_DATE, START_TIME, END_TIME, VENUE, CREATED_BY, CURRENT_STATUS, EVENT_SCALE) 
VALUES ('EVT-SEED-01', 'CSE', 'Academic', 'Workshop', 'offline', 'Annual Tech Symposium 2025', 'A university-wide technical symposium featuring project showcases.', '2025-05-10', '2025-05-10', '09:00:00', '17:00:00', 'Main Auditorium', @hod_cse_id, 'completed', 'university');
SET @evt1_id = LAST_INSERT_ID();
INSERT INTO event_metadata (EVENT_ID, APPROVAL_ROUTE, APPROVAL_HISTORY_JSON, MAX_PARTICIPANTS, BUDGET, DETAILS_JSON) 
VALUES (@evt1_id, '["hod", "dean", "pro_vc", "vc"]', '[{"role":"hod","status":"approved","timestamp":"2025-04-01 10:00:00"}]', 100, 5000, '{}');

-- Event 2: Completed
INSERT INTO event_master (EVENT_ID, DEPARTMENT, CATEGORY, TYPE, MODE, EVENT, DESCRIPTION, START_DATE, END_DATE, START_TIME, END_TIME, VENUE, CREATED_BY, CURRENT_STATUS, EVENT_SCALE) 
VALUES ('EVT-SEED-02', 'Student Affairs', 'Cultural', 'Workshop', 'offline', 'Cultural Fest - Sparks', 'State level cultural fest with music and dance performances.', '2025-11-20', '2025-11-20', '10:00:00', '22:00:00', 'University Open Ground', @dir_sa_id, 'completed', 'state');
SET @evt2_id = LAST_INSERT_ID();
INSERT INTO event_metadata (EVENT_ID, APPROVAL_ROUTE, APPROVAL_HISTORY_JSON, MAX_PARTICIPANTS, BUDGET, DETAILS_JSON) 
VALUES (@evt2_id, '["hod", "director", "dean", "pro_vc", "vc"]', '[]', 100, 5000, '{}');

-- Event 3: Completed
INSERT INTO event_master (EVENT_ID, DEPARTMENT, CATEGORY, TYPE, MODE, EVENT, DESCRIPTION, START_DATE, END_DATE, START_TIME, END_TIME, VENUE, CREATED_BY, CURRENT_STATUS, EVENT_SCALE) 
VALUES ('EVT-SEED-03', 'AIML', 'Academic', 'Workshop', 'offline', 'Guest Lecture on AI Innovations', 'Expert talk on AI trends by industry leaders.', '2026-02-15', '2026-02-15', '14:00:00', '16:00:00', 'Seminar Hall A', @fac_cse_id, 'completed', 'department');
SET @evt3_id = LAST_INSERT_ID();
INSERT INTO event_metadata (EVENT_ID, APPROVAL_ROUTE, APPROVAL_HISTORY_JSON, MAX_PARTICIPANTS, BUDGET, DETAILS_JSON) 
VALUES (@evt3_id, '["hod"]', '[]', 100, 5000, '{}');

-- Event 4: Pending
INSERT INTO event_master (EVENT_ID, DEPARTMENT, CATEGORY, TYPE, MODE, EVENT, DESCRIPTION, START_DATE, END_DATE, START_TIME, END_TIME, VENUE, CREATED_BY, CURRENT_STATUS, EVENT_SCALE) 
VALUES ('EVT-SEED-04', 'CSE', 'Academic', 'Workshop', 'offline', 'National Hackathon 2026', '36-hour coding marathon.', '2026-09-10', '2026-09-10', '08:00:00', '20:00:00', 'Innovation Lab', @fac_cse_id, 'pending_hod', 'national');
SET @evt4_id = LAST_INSERT_ID();
INSERT INTO event_metadata (EVENT_ID, APPROVAL_ROUTE, APPROVAL_HISTORY_JSON, MAX_PARTICIPANTS, BUDGET, DETAILS_JSON) 
VALUES (@evt4_id, '["hod", "director", "dean", "pro_vc", "vc"]', '[]', 100, 5000, '{}');

-- Event 5: Pending
INSERT INTO event_master (EVENT_ID, DEPARTMENT, CATEGORY, TYPE, MODE, EVENT, DESCRIPTION, START_DATE, END_DATE, START_TIME, END_TIME, VENUE, CREATED_BY, CURRENT_STATUS, EVENT_SCALE) 
VALUES ('EVT-SEED-05', 'Student Affairs', 'Sports', 'Workshop', 'offline', 'Inter-School Sports Meet', 'Annual sports competition between schools.', '2026-09-25', '2026-09-25', '07:00:00', '18:00:00', 'Sports Complex', @dir_sa_id, 'pending_dean', 'university');
SET @evt5_id = LAST_INSERT_ID();
INSERT INTO event_metadata (EVENT_ID, APPROVAL_ROUTE, APPROVAL_HISTORY_JSON, MAX_PARTICIPANTS, BUDGET, DETAILS_JSON) 
VALUES (@evt5_id, '["hod", "dean", "pro_vc", "vc"]', '[{"role":"hod","status":"approved","timestamp":"2026-08-10 10:00:00"}]', 100, 5000, '{}');

-- Event 6: Pending
INSERT INTO event_master (EVENT_ID, DEPARTMENT, CATEGORY, TYPE, MODE, EVENT, DESCRIPTION, START_DATE, END_DATE, START_TIME, END_TIME, VENUE, CREATED_BY, CURRENT_STATUS, EVENT_SCALE) 
VALUES ('EVT-SEED-06', 'CSE', 'Academic', 'Workshop', 'offline', 'Blockchain Workshop', 'Hands-on workshop on smart contracts.', '2026-10-05', '2026-10-05', '10:00:00', '13:00:00', 'Computer Lab 3', @hod_cse_id, 'pending_director', 'faculty');
SET @evt6_id = LAST_INSERT_ID();
INSERT INTO event_metadata (EVENT_ID, APPROVAL_ROUTE, APPROVAL_HISTORY_JSON, MAX_PARTICIPANTS, BUDGET, DETAILS_JSON) 
VALUES (@evt6_id, '["hod", "director"]', '[{"role":"hod","status":"approved","timestamp":"2026-08-11 10:00:00"}]', 100, 5000, '{}');

-- Add Registrations for completed events
INSERT IGNORE INTO event_registrations (STUDENT_ID, EVENT_ID, STATUS, ROLE, ATTENDED, CHECK_IN_STATUS, REGISTRATION_DATE) VALUES
('GMBCAT01', @evt1_id, 'active', 'participant', 1, 'checked_in', '2025-01-01 10:00:00'),
('GMBCDA01', @evt1_id, 'active', 'participant', 1, 'checked_in', '2025-01-01 10:00:00'),
('GMBCAI01', @evt1_id, 'active', 'participant', 1, 'checked_in', '2025-01-01 10:00:00'),
('GMBCAT01', @evt2_id, 'active', 'participant', 1, 'checked_in', '2025-01-01 10:00:00'),
('GMBCDA01', @evt2_id, 'active', 'participant', 1, 'checked_in', '2025-01-01 10:00:00'),
('GMBCAI01', @evt2_id, 'active', 'participant', 1, 'checked_in', '2025-01-01 10:00:00'),
('GMBCAT01', @evt3_id, 'active', 'participant', 1, 'checked_in', '2025-01-01 10:00:00'),
('GMBCDA01', @evt3_id, 'active', 'participant', 1, 'checked_in', '2025-01-01 10:00:00'),
('GMBCAI01', @evt3_id, 'active', 'participant', 1, 'checked_in', '2025-01-01 10:00:00');
