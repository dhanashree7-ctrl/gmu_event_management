-- ==============================================================================
-- File: database/events_master.sql
-- Description: Creates the EventsMaster table in the gmu_events database.
-- Run AFTER schema.sql (users table must already exist).
-- ==============================================================================

USE gmu_events;

-- ==============================================================================
-- Table: EventsMaster
-- Description: Central table for all university event requests and their
--              lifecycle from proposal → approval → completion.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS EventsMaster (

  -- Primary key
  id                INT UNSIGNED   NOT NULL AUTO_INCREMENT,

  -- Event details
  event_title       VARCHAR(255)   NOT NULL,
  description       TEXT           NULL,

  -- Category is restricted to two values
  category          ENUM('Department', 'University') NOT NULL,

  -- Who created this request (FK → users)
  proposed_by_id    INT UNSIGNED   NOT NULL,

  -- Lifecycle status; always starts as 'Pending'
  current_status    ENUM('Pending', 'Approved', 'Completed', 'Rejected')
                                   NOT NULL DEFAULT 'Pending',

  -- Financial field; stored with 2 decimal places
  budget            DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

  -- Set to TRUE once the post-event report is submitted
  report_submitted  BOOLEAN        NOT NULL DEFAULT FALSE,

  -- Audit timestamps
  created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP,

  -- ── Constraints ──────────────────────────────────────────────────────────
  PRIMARY KEY (id),

  -- Fast lookup by status (HOD/Director approval queues)
  KEY idx_events_status (current_status),

  -- Fast lookup by proposer (faculty "my events" view)
  KEY idx_events_proposed_by (proposed_by_id),

  -- Referential integrity: cannot delete a user who has proposed events
  -- (use ON DELETE RESTRICT so you must re-assign or archive first)
  CONSTRAINT fk_events_proposed_by
    FOREIGN KEY (proposed_by_id)
    REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Master table for all university event requests';


-- ==============================================================================
-- Verification: show the table structure after creation
-- ==============================================================================
DESCRIBE EventsMaster;
