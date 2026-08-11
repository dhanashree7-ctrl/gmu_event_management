USE gmu_events;

-- Insert CSE Students
INSERT INTO users (usn_or_emp_id, full_name, password, system_role, department, email) 
SELECT 'cse_stu1', 'CSE Student 1', '$2y$10$0L56XZXxw6kZlCsDED5noee1JjU8l9UjZnTo1uIo5Y9HmUBDB9Rpe', 'student', 'CSE', 'cse1@gmu.edu'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE usn_or_emp_id = 'cse_stu1');

INSERT INTO users (usn_or_emp_id, full_name, password, system_role, department, email) 
SELECT 'cse_stu2', 'CSE Student 2', '$2y$10$0L56XZXxw6kZlCsDED5noee1JjU8l9UjZnTo1uIo5Y9HmUBDB9Rpe', 'student', 'CSE', 'cse2@gmu.edu'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE usn_or_emp_id = 'cse_stu2');

-- Insert CIVIL Students
INSERT INTO users (usn_or_emp_id, full_name, password, system_role, department, email) 
SELECT 'civil_stu1', 'Civil Student 1', '$2y$10$0L56XZXxw6kZlCsDED5noee1JjU8l9UjZnTo1uIo5Y9HmUBDB9Rpe', 'student', 'CIVIL', 'civil1@gmu.edu'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE usn_or_emp_id = 'civil_stu1');

INSERT INTO users (usn_or_emp_id, full_name, password, system_role, department, email) 
SELECT 'civil_stu2', 'Civil Student 2', '$2y$10$0L56XZXxw6kZlCsDED5noee1JjU8l9UjZnTo1uIo5Y9HmUBDB9Rpe', 'student', 'CIVIL', 'civil2@gmu.edu'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE usn_or_emp_id = 'civil_stu2');
