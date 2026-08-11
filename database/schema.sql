-- ============================================================
--  University Event Management System
--  Database Schema — Task 1
--  Run this script once to bootstrap the MySQL database.
-- ============================================================

CREATE DATABASE IF NOT EXISTS university_events
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE university_events;

-- ============================================================
--  Table: users
--  Stores every account in the system.
--  Roles: admin | organizer | faculty_advisor | student | viewer
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  name            VARCHAR(150)     NOT NULL,
  email           VARCHAR(254)     NOT NULL,
  password_hash   VARCHAR(255)     NOT NULL,          -- bcrypt hash via PHP password_hash()
  role_name       ENUM(
                    'admin',
                    'organizer',
                    'faculty_advisor',
                    'student',
                    'viewer'
                  )                NOT NULL DEFAULT 'viewer',
  department_name VARCHAR(120)     NOT NULL DEFAULT '',
  is_active       TINYINT(1)       NOT NULL DEFAULT 1, -- soft-disable accounts without deleting
  created_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  Seed: insert sample users (passwords are 'Password@123')
--  Generate real hashes with:
--    php -r "echo password_hash('Password@123', PASSWORD_BCRYPT);"
-- ============================================================
INSERT INTO users (name, email, password_hash, role_name, department_name) VALUES
  (
    'Admin User',
    'admin@university.edu',
    '$2y$12$REPLACE_WITH_REAL_BCRYPT_HASH_FOR_ADMIN',
    'admin',
    'Administration'
  ),
  (
    'Dr. Priya Sharma',
    'priya.sharma@university.edu',
    '$2y$12$REPLACE_WITH_REAL_BCRYPT_HASH_FOR_FACULTY',
    'faculty_advisor',
    'Computer Science'
  ),
  (
    'Rahul Mehta',
    'rahul.mehta@university.edu',
    '$2y$12$REPLACE_WITH_REAL_BCRYPT_HASH_FOR_ORGANIZER',
    'organizer',
    'Student Affairs'
  ),
  (
    'Ananya Patel',
    'ananya.patel@university.edu',
    '$2y$12$REPLACE_WITH_REAL_BCRYPT_HASH_FOR_STUDENT',
    'student',
    'Electronics Engineering'
  );

-- NOTE: Replace all placeholder hashes above before use in production.
-- To generate a real hash (from CLI):
--   php -r "echo password_hash('Password@123', PASSWORD_BCRYPT) . PHP_EOL;"
