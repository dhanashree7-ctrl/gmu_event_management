<?php
/**
 * backend/config/role_helper.php
 * ─────────────────────────────────────────────────────────────────────────────
 * Maps the enterprise users table DESIGNATION column to the application's
 * internal role strings used throughout every dashboard and approval workflow.
 *
 * Enterprise table uses: USER_NAME, PASSWORD, NAME, DESIGNATION, DISCIPLINE,
 *                        FACULTY, SCHOOL, device_token, USER_GROUP, STATUS
 *
 * Internal app roles: student, faculty, hod, director, dean, provc, vc,
 *                     student_affairs, events_admin, staff
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Derives the internal application role from the enterprise DESIGNATION string.
 *
 * @param  string $designation  Value from the DESIGNATION column.
 * @param  string $user_group   Value from the USER_GROUP column (fallback hint).
 * @return string               Internal role string.
 */
function get_role_from_designation(string $designation, string $user_group = ''): string {
    $d = strtoupper(trim($designation));

    // ── Students ────────────────────────────────────────────────────────────
    if ($d === 'STUDENT' || $user_group === 'STUDENT') return 'student';

    // ── VC / Pro-VC ─────────────────────────────────────────────────────────
    if ($d === 'VICE CHANCELLOR') return 'vc';
    if (strpos($d, 'PRO') !== false && strpos($d, 'VICE CHANCELLOR') !== false) return 'provc';
    if ($d === 'CHANCELLOR') return 'vc';

    // ── HOD (must come before generic PROFESSOR check) ──────────────────────
    if (strpos($d, 'HOD') !== false) return 'hod';
    if ($d === 'PROGRAMME HEAD' || $d === 'PROGRAM MANAGER') return 'hod';

    // ── Dean ────────────────────────────────────────────────────────────────
    if (strpos($d, 'DEAN') !== false) return 'dean';

    // ── Director ────────────────────────────────────────────────────────────
    if (strpos($d, 'DIRECTOR') !== false) {
        // Student Affairs director gets a special role
        if (strpos($d, 'STUDENT AFFAIRS') !== false) return 'student_affairs';
        return 'director';
    }

    // ── Student Affairs (non-director) ──────────────────────────────────────
    if (strpos($d, 'STUDENT AFFAIRS') !== false) return 'student_affairs';

    // ── Events Admin ────────────────────────────────────────────────────────
    if ($d === 'EVENTS ADMIN' || $d === 'EVENTS_ADMIN') return 'events_admin';

    // ── Teaching Faculty ────────────────────────────────────────────────────
    $faculty_designations = [
        'FACULTY', 'PROFESSOR', 'ASSOCIATE PROFESSOR', 'ASSISTANT PROFESSOR',
        'ASST. PROFESSOR', 'ASSITANT PROFESSOR', 'ASSOC. PROFESSOR',
        'ASSOCIAITE PROFESSOR', 'VISITING FACULTY', 'GUEST FACULTY',
        'GUEST_FACULTY', 'LECTURER', 'INSTRUCTOR', 'LAB INSTRUCTOR',
        'TUTOR', 'PROFESSOR OF PRACTICE', 'ADJUNCT PROFESSOR',
        'SENIOR FACULTY', 'FACULTY HEAD',
    ];
    if (in_array($d, $faculty_designations, true)) return 'faculty';
    // Catch compound designations like "PROFESSOR-DS-IoT"
    if (strpos($d, 'PROFESSOR') !== false) return 'faculty';
    if ($user_group === 'FACULTY') return 'faculty';

    // ── Fallback ─────────────────────────────────────────────────────────────
    return 'staff';
}
