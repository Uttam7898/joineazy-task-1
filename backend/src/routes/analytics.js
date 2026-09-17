import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/overview", requireAuth, requireRole("admin"), async (_req, res) => {
  const students = await query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'student'`);
  const groups = await query(`SELECT COUNT(*)::int AS count FROM groups`);
  const assignments = await query(`SELECT COUNT(*)::int AS count FROM assignments`);
  const confirmations = await query(`SELECT COUNT(*)::int AS count FROM submission_confirmations`);

  const byAssignment = await query(`
    SELECT a.id, a.title,
      COUNT(DISTINCT gm.user_id)::int AS eligible_students,
      COUNT(DISTINCT sc.user_id)::int AS confirmed_students
    FROM assignments a
    JOIN assignment_targets t ON t.assignment_id = a.id
    JOIN groups g ON (t.group_id IS NULL OR t.group_id = g.id)
    JOIN group_members gm ON gm.group_id = g.id
    LEFT JOIN submission_confirmations sc
      ON sc.assignment_id = a.id AND sc.user_id = gm.user_id
    GROUP BY a.id, a.title
    ORDER BY a.due_date
  `);

  const groupRows = await query(`SELECT id, name FROM groups ORDER BY name`);
  const groupPerformance = [];
  for (const g of groupRows.rows) {
    const targetAssignments = await query(
      `SELECT DISTINCT a.id
       FROM assignments a
       JOIN assignment_targets t ON t.assignment_id = a.id
       WHERE t.group_id IS NULL OR t.group_id = $1`,
      [g.id]
    );
    const memberCountRes = await query(
      `SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1`,
      [g.id]
    );
    const memberCount = memberCountRes.rows[0]?.count || 0;

    let complete = 0;
    if (memberCount > 0) {
      for (const a of targetAssignments.rows) {
        const confCountRes = await query(
          `SELECT COUNT(*)::int AS count
           FROM submission_confirmations
           WHERE assignment_id = $1 AND group_id = $2`,
          [a.id, g.id]
        );
        if (confCountRes.rows[0]?.count >= memberCount) {
          complete += 1;
        }
      }
    }

    groupPerformance.push({
      id: g.id,
      name: g.name,
      assigned: targetAssignments.rows.length,
      complete,
    });
  }

  const studentsDetail = await query(`
    SELECT u.id, u.name, u.email, u.student_id,
           g.id AS group_id, g.name AS group_name,
           COUNT(DISTINCT sc.id)::int AS confirmations
    FROM users u
    LEFT JOIN group_members gm ON gm.user_id = u.id
    LEFT JOIN groups g ON g.id = gm.group_id
    LEFT JOIN submission_confirmations sc ON sc.user_id = u.id
    WHERE u.role = 'student'
    GROUP BY u.id, g.id
    ORDER BY u.name
  `);

  res.json({
    totals: {
      students: students.rows[0].count,
      groups: groups.rows[0].count,
      assignments: assignments.rows[0].count,
      confirmations: confirmations.rows[0].count,
    },
    byAssignment: byAssignment.rows.map((r) => ({
      id: r.id,
      title: r.title,
      eligibleStudents: r.eligible_students,
      confirmedStudents: r.confirmed_students,
      percent: r.eligible_students
        ? Math.round((r.confirmed_students / r.eligible_students) * 100)
        : 0,
    })),
    groupPerformance,
    students: studentsDetail.rows.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      studentId: s.student_id,
      groupId: s.group_id,
      groupName: s.group_name,
      confirmations: s.confirmations,
    })),
  });
});

export default router;
