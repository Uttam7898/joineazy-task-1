import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { publicUser, requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, studentId } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password || !studentId?.trim()) {
      return res.status(400).json({ error: "Name, email, student ID, and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, student_id)
       VALUES ($1, $2, $3, 'student', $4)
       RETURNING id, name, email, role, student_id`,
      [name.trim(), email.trim().toLowerCase(), hash, studentId.trim()]
    );
    const user = publicUser(result.rows[0]);
    res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email or student ID is already registered." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not register." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const result = await query(
      `SELECT id, name, email, role, student_id, password_hash FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );
    const row = result.rows[0];
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const user = publicUser(row);
    res.json({ user, token: signToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not sign in." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const result = await query(
    `SELECT id, name, email, role, student_id FROM users WHERE id = $1`,
    [req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "User not found." });
  res.json({ user: publicUser(result.rows[0]) });
});

export default router;
