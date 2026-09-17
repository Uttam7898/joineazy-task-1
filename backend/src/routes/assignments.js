import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

async function studentGroupId(userId) {
  const result = await query(`SELECT group_id FROM group_members WHERE user_id = $1`, [userId]);
  return result.rows[0]?.group_id || null;
}

async function assignmentTargets(assignmentId) {
  const result = await query(
    `SELECT at.group_id, g.name
     FROM assignment_targets at
     LEFT JOIN groups g ON g.id = at.group_id
     WHERE at.assignment_id = $1`,
    [assignmentId]
  );
  const all = result.rows.some((r) => r.group_id == null);
  return {
    all,
    groups: result.rows
      .filter((r) => r.group_id != null)
      .map((r) => ({ id: r.group_id, name: r.name })),
  };
}

async function progressForAssignment(assignmentId, groupId) {
  if (!groupId) {
    return { groupId: null, confirmed: 0, total: 0, percent: 0, members: [] };
  }
  const members = await query(
    `SELECT u.id, u.name, u.email, u.student_id,
            sc.confirmed_at
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     LEFT JOIN submission_confirmations sc
       ON sc.user_id = u.id AND sc.assignment_id = $1 AND sc.group_id = $2
     WHERE gm.group_id = $2
     ORDER BY u.name`,
    [assignmentId, groupId]
  );
  const confirmed = members.rows.filter((m) => m.confirmed_at).length;
  const total = members.rows.length;
  return {
    groupId,
    confirmed,
    total,
    percent: total ? Math.round((confirmed / total) * 100) : 0,
    members: members.rows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      studentId: m.student_id,
      confirmed: Boolean(m.confirmed_at),
      confirmedAt: m.confirmed_at,
    })),
  };
}

function mapAssignment(row, targets) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    onedriveLink: row.onedrive_link,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    targetAll: targets.all,
    targetGroups: targets.groups,
  };
}

async function studentCanSee(assignmentId, groupId) {
  const result = await query(
    `SELECT 1 FROM assignment_targets
     WHERE assignment_id = $1 AND (group_id IS NULL OR group_id = $2)`,
    [assignmentId, groupId]
  );
  return result.rowCount > 0;
}

router.get("/", requireAuth, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const result = await query(`SELECT * FROM assignments ORDER BY due_date`);
      const assignments = [];
      for (const row of result.rows) {
        assignments.push(mapAssignment(row, await assignmentTargets(row.id)));
      }
      return res.json({ assignments });
    }

    const groupId = await studentGroupId(req.user.id);
    const result = await query(
      `SELECT DISTINCT a.*
       FROM assignments a
       JOIN assignment_targets t ON t.assignment_id = a.id
       WHERE t.group_id IS NULL OR t.group_id = $1
       ORDER BY a.due_date`,
      [groupId]
    );
    const assignments = [];
    for (const row of result.rows) {
      const mapped = mapAssignment(row, await assignmentTargets(row.id));
      mapped.progress = await progressForAssignment(row.id, groupId);
      mapped.myConfirmation = mapped.progress.members.find((m) => m.id === req.user.id) || null;
      assignments.push(mapped);
    }
    res.json({ assignments, groupId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load assignments." });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const result = await query(`SELECT * FROM assignments WHERE id = $1`, [id]);
  if (!result.rows[0]) return res.status(404).json({ error: "Assignment not found." });

  if (req.user.role === "student") {
    const groupId = await studentGroupId(req.user.id);
    if (!(await studentCanSee(id, groupId))) {
      return res.status(403).json({ error: "This assignment is not assigned to you." });
    }
    const mapped = mapAssignment(result.rows[0], await assignmentTargets(id));
    mapped.progress = await progressForAssignment(id, groupId);
    mapped.myConfirmation = mapped.progress.members.find((m) => m.id === req.user.id) || null;
    return res.json({ assignment: mapped });
  }

  const mapped = mapAssignment(result.rows[0], await assignmentTargets(id));
  const groups = await query(`SELECT id FROM groups ORDER BY name`);
  const groupProgress = [];
  for (const g of groups.rows) {
    const visible = await studentCanSee(id, g.id);
    if (!visible) continue;
    const progress = await progressForAssignment(id, g.id);
    const groupName = await query(`SELECT name FROM groups WHERE id = $1`, [g.id]);
    groupProgress.push({ ...progress, name: groupName.rows[0].name });
  }
  mapped.groupProgress = groupProgress;
  res.json({ assignment: mapped });
});

async function saveTargets(assignmentId, targetAll, groupIds) {
  await query(`DELETE FROM assignment_targets WHERE assignment_id = $1`, [assignmentId]);
  if (targetAll) {
    await query(`INSERT INTO assignment_targets (assignment_id, group_id) VALUES ($1, NULL)`, [
      assignmentId,
    ]);
    return;
  }
  const ids = Array.isArray(groupIds) ? groupIds.map(Number).filter(Boolean) : [];
  if (!ids.length) {
    throw Object.assign(new Error("Select at least one group, or assign to all groups."), {
      status: 400,
    });
  }
  for (const gid of ids) {
    await query(`INSERT INTO assignment_targets (assignment_id, group_id) VALUES ($1, $2)`, [
      assignmentId,
      gid,
    ]);
  }
}

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { title, description, dueDate, onedriveLink, targetAll, groupIds } = req.body || {};
    if (!title?.trim() || !dueDate || !onedriveLink?.trim()) {
      return res.status(400).json({ error: "Title, due date, and OneDrive link are required." });
    }
    const created = await query(
      `INSERT INTO assignments (title, description, due_date, onedrive_link, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title.trim(), description?.trim() || "", dueDate, onedriveLink.trim(), req.user.id]
    );
    await saveTargets(created.rows[0].id, Boolean(targetAll), groupIds);
    res.status(201).json({
      assignment: mapAssignment(created.rows[0], await assignmentTargets(created.rows[0].id)),
    });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.status ? err.message : "Could not create assignment." });
  }
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await query(`SELECT * FROM assignments WHERE id = $1`, [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: "Assignment not found." });
    const { title, description, dueDate, onedriveLink, targetAll, groupIds } = req.body || {};
    const updated = await query(
      `UPDATE assignments
       SET title = $1, description = $2, due_date = $3, onedrive_link = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [
        title?.trim() || existing.rows[0].title,
        description !== undefined ? description.trim() : existing.rows[0].description,
        dueDate || existing.rows[0].due_date,
        onedriveLink?.trim() || existing.rows[0].onedrive_link,
        id,
      ]
    );
    if (targetAll !== undefined || groupIds !== undefined) {
      await saveTargets(id, Boolean(targetAll), groupIds);
    }
    res.json({
      assignment: mapAssignment(updated.rows[0], await assignmentTargets(id)),
    });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.status ? err.message : "Could not update assignment." });
  }
});

router.post("/:id/confirm", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { step, confirmed } = req.body || {};
    if (Number(step) !== 2 || confirmed !== true) {
      return res.status(400).json({
        error: "Two-step confirmation required. Send { step: 2, confirmed: true } after the UI prompt.",
      });
    }

    const groupId = await studentGroupId(req.user.id);
    if (!groupId) {
      return res.status(400).json({ error: "Join a group before confirming a submission." });
    }
    const assignment = await query(`SELECT id FROM assignments WHERE id = $1`, [id]);
    if (!assignment.rows[0]) return res.status(404).json({ error: "Assignment not found." });
    if (!(await studentCanSee(id, groupId))) {
      return res.status(403).json({ error: "This assignment is not assigned to your group." });
    }

    await query(
      `INSERT INTO submission_confirmations (assignment_id, group_id, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (assignment_id, user_id) DO NOTHING`,
      [id, groupId, req.user.id]
    );

    const mapped = mapAssignment(
      (await query(`SELECT * FROM assignments WHERE id = $1`, [id])).rows[0],
      await assignmentTargets(id)
    );
    mapped.progress = await progressForAssignment(id, groupId);
    mapped.myConfirmation = mapped.progress.members.find((m) => m.id === req.user.id) || null;
    res.json({ assignment: mapped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not confirm submission." });
  }
});

export default router;
