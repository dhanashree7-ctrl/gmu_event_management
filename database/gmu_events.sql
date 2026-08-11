-- ==============================================================================
-- Database: gmu_events
-- Description: Complete SQL script for MySQL Workbench to set up the 
--              GM University Event Management System database.
-- ==============================================================================

-- Create the database if it doesn't exist and switch to it
CREATE DATABASE IF NOT EXISTS gmu_events
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gmu_events;

-- ==============================================================================
-- Table: users
-- Description: Stores all system users and their roles.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(254) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role_name       ENUM('admin', 'organizer', 'faculty_advisor', 'student', 'viewer') NOT NULL DEFAULT 'viewer',
  department_name VARCHAR(120) NOT NULL DEFAULT '',
  
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- Table: EventsMaster
-- Description: Stores the main details for all events in the system.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS EventsMaster (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_title       VARCHAR(255) NOT NULL,
  description       TEXT,
  category          VARCHAR(100) NOT NULL,
  proposed_by_id    INT UNSIGNED NOT NULL,
  current_status    ENUM('draft', 'pending_approval', 'approved', 'rejected', 'completed', 'cancelled') NOT NULL DEFAULT 'draft',
  budget            DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  report_submitted  BOOLEAN NOT NULL DEFAULT FALSE,
  
  PRIMARY KEY (id),
  
  -- Foreign Key Constraint referencing the users table
  CONSTRAINT fk_events_proposed_by 
    FOREIGN KEY (proposed_by_id) 
    REFERENCES users (id) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- Mock Data Insertion
-- Description: Appending 3 mock records for testing queries.
-- ==============================================================================

-- 1. Insert mock users first (since EventsMaster depends on users.id)
INSERT INTO users (name, email, password_hash, role_name, department_name) VALUES
('Alice Smith', 'alice@gm.edu', '$2y$12$samplehash123456789012345678901234567890123456789012', 'admin', 'Administration'),
('Bob Jones', 'bob@gm.edu', '$2y$12$samplehash123456789012345678901234567890123456789012', 'organizer', 'Computer Science'),
('Charlie Brown', 'charlie@gm.edu', '$2y$12$samplehash123456789012345678901234567890123456789012', 'student', 'Arts');

-- 2. Insert mock events linked to the users
INSERT INTO EventsMaster (event_title, description, category, proposed_by_id, current_status, budget, report_submitted) VALUES
('Annual Tech Symposium', 'A two-day technology symposium featuring guest speakers and hackathons.', 'Academic', 2, 'approved', 5000.00, FALSE),
('Freshers Welcome Party', 'Welcome event for the incoming batch of 2026.', 'Social', 3, 'pending_approval', 1500.00, FALSE),
('Faculty Development Workshop', 'Workshop on modern teaching methodologies.', 'Workshop', 1, 'completed', 800.00, TRUE);
