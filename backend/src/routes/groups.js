import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

async function studentGroup(userId) {
  const result = await query(
    `SELECT g.id, g.name, g.created_by, g.created_at
     FROM groups g
     JOIN group_members gm ON gm.group_id = g.id
     WHERE gm.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function groupWithMembers(groupId) {
  const groupRes = await query(
    `SELECT id, name, created_by, created_at FROM groups WHERE id = $1`,
    [groupId]
  );
  if (!groupRes.rows[0]) return null;
  const members = await query(
    `SELECT u.id, u.name, u.email, u.student_id, gm.joined_at
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY gm.joined_at`,
    [groupId]
  );
  return {
    id: groupRes.rows[0].id,
    name: groupRes.rows[0].name,
    createdBy: groupRes.rows[0].created_by,
    createdAt: groupRes.rows[0].created_at,
    members: members.rows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      studentId: m.student_id,
      joinedAt: m.joined_at,
    })),
  };
}

router.get("/mine", requireAuth, requireRole("student"), async (req, res) => {
  const group = await studentGroup(req.user.id);
  if (!group) return res.json({ group: null });
  res.json({ group: await groupWithMembers(group.id) });
});

router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  const groups = await query(`SELECT id, name, created_by, created_at FROM groups ORDER BY name`);
  const payload = [];
  for (const g of groups.rows) {
    payload.push(await groupWithMembers(g.id));
  }
  res.json({ groups: payload });
});

router.post("/", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const existing = await studentGroup(req.user.id);
    if (existing) {
      return res.status(409).json({ error: "You already belong to a group." });
    }
    const name = (req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "Group name is required." });

    const created = await query(
      `INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING id`,
      [name, req.user.id]
    );
    await query(`INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`, [
      created.rows[0].id,
      req.user.id,
    ]);
    res.status(201).json({ group: await groupWithMembers(created.rows[0].id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create group." });
  }
});

router.post("/:id/members", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const group = await groupWithMembers(groupId);
    if (!group) return res.status(404).json({ error: "Group not found." });
    if (group.createdBy !== req.user.id) {
      return res.status(403).json({ error: "Only the group creator can add members." });
    }

    const identifier = (req.body?.email || req.body?.studentId || "").trim();
    if (!identifier) {
      return res.status(400).json({ error: "Provide a student email or ID." });
    }

    const userRes = await query(
      `SELECT id, role FROM users
       WHERE role = 'student' AND (LOWER(email) = LOWER($1) OR student_id = $1)`,
      [identifier]
    );
    const student = userRes.rows[0];
    if (!student) return res.status(404).json({ error: "No student matches that email or ID." });
    if (student.id === req.user.id) {
      return res.status(400).json({ error: "You are already in this group." });
    }

    try {
      await query(`INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`, [
        groupId,
        student.id,
      ]);
    } catch (err) {
      if (err.code === "23505") {
        return res.status(409).json({ error: "That student already belongs to a group." });
      }
      throw err;
    }

    res.json({ group: await groupWithMembers(groupId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add member." });
  }
});

router.delete("/:id/members/:userId", requireAuth, requireRole("student"), async (req, res) => {
  const groupId = Number(req.params.id);
  const userId = Number(req.params.userId);
  const group = await groupWithMembers(groupId);
  if (!group) return res.status(404).json({ error: "Group not found." });
  if (group.createdBy !== req.user.id) {
    return res.status(403).json({ error: "Only the group creator can remove members." });
  }
  if (userId === group.createdBy) {
    return res.status(400).json({ error: "The creator cannot be removed." });
  }
  await query(`DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`, [groupId, userId]);
  res.json({ group: await groupWithMembers(groupId) });
});

export default router;
