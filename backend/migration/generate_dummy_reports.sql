USE GMU_Events01;

UPDATE event_metadata 
SET POST_EVENT_REPORT = 'This event was executed successfully. All sub-events concluded on time, and participant feedback was overwhelmingly positive. Budget utilization was optimal, and the final outcomes exceeded the initial objectives.', 
    REPORT_PDF_PATH = 'dummy_report.pdf' 
WHERE EVENT_ID IN (3, 4, 5, 9, 10, 11);

-- Insert dummy registrations for event 3
INSERT IGNORE INTO event_registrations (STUDENT_ID, EVENT_ID, STATUS, ROLE, FEEDBACK_RATING, FEEDBACK_COMMENTS, attendance_status, attended, CHECK_IN_STATUS)
VALUES ('GMBCAT01', 3, 'active', 'participant', 5, 'Great event, learned a lot!', 'Attended', 1, 'checked_in'),
       ('GMBCDA01', 3, 'active', 'participant', 4, 'Well organized and very informative.', 'Attended', 1, 'checked_in');

-- Insert dummy registrations for event 4
INSERT IGNORE INTO event_registrations (STUDENT_ID, EVENT_ID, STATUS, ROLE, FEEDBACK_RATING, FEEDBACK_COMMENTS, attendance_status, attended, CHECK_IN_STATUS)
VALUES ('GMBCAI01', 4, 'active', 'participant', 5, 'Amazing experience, looking forward to the next one.', 'Attended', 1, 'checked_in'),
       ('GMCS01', 4, 'active', 'participant', 3, 'The sessions were a bit long but overall good.', 'Attended', 1, 'checked_in');

-- Insert dummy registrations for event 5
INSERT IGNORE INTO event_registrations (STUDENT_ID, EVENT_ID, STATUS, ROLE, FEEDBACK_RATING, FEEDBACK_COMMENTS, attendance_status, attended, CHECK_IN_STATUS)
VALUES ('GMBCAT01', 5, 'active', 'participant', 4, 'Good speakers and relevant topics.', 'Attended', 1, 'checked_in');

-- Insert dummy registrations for event 9
INSERT IGNORE INTO event_registrations (STUDENT_ID, EVENT_ID, STATUS, ROLE, FEEDBACK_RATING, FEEDBACK_COMMENTS, attendance_status, attended, CHECK_IN_STATUS)
VALUES ('GMBCDA01', 9, 'active', 'participant', 5, 'Could have had better catering, but the content was top-notch.', 'Attended', 1, 'checked_in');

-- Insert dummy registrations for event 10
INSERT IGNORE INTO event_registrations (STUDENT_ID, EVENT_ID, STATUS, ROLE, FEEDBACK_RATING, FEEDBACK_COMMENTS, attendance_status, attended, CHECK_IN_STATUS)
VALUES ('GMBCAI01', 10, 'active', 'participant', 4, 'Very good experience.', 'Attended', 1, 'checked_in');

-- Insert dummy registrations for event 11
INSERT IGNORE INTO event_registrations (STUDENT_ID, EVENT_ID, STATUS, ROLE, FEEDBACK_RATING, FEEDBACK_COMMENTS, attendance_status, attended, CHECK_IN_STATUS)
VALUES ('GMCS01', 11, 'active', 'participant', 5, 'The best event this year.', 'Attended', 1, 'checked_in');

-- Now update any existing registrations for these events to make sure they have feedback and attendance marked
UPDATE event_registrations
SET FEEDBACK_RATING = 5, FEEDBACK_COMMENTS = 'Excellent event.', attendance_status = 'Attended', attended = 1, CHECK_IN_STATUS = 'checked_in'
WHERE EVENT_ID IN (3, 4, 5, 9, 10, 11) AND FEEDBACK_RATING IS NULL;
