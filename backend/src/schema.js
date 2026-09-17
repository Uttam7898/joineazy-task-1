import bcrypt from "bcryptjs";
import { query } from "./db.js";

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
  student_id VARCHAR(50) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS one_group_per_student
  ON group_members (user_id);

CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  onedrive_link TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_targets (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS assignment_target_all
  ON assignment_targets (assignment_id)
  WHERE group_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS assignment_target_group
  ON assignment_targets (assignment_id, group_id)
  WHERE group_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS submission_confirmations (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assignment_id, user_id)
);
`;

async function seed() {
  const { rows } = await query("SELECT COUNT(*)::int AS count FROM users");
  if (rows[0].count > 0) return;

  const adminHash = await bcrypt.hash("Admin123!", 10);
  const studentHash = await bcrypt.hash("Student123!", 10);

  const admin = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin') RETURNING id`,
    ["Prof. Asha Mehta", "professor@joineazy.edu", adminHash]
  );

  const names = [
    ["Aarav Shah", "aarav@uni.edu", "STU001"],
    ["Diya Patel", "diya@uni.edu", "STU002"],
    ["Kabir Rao", "kabir@uni.edu", "STU003"],
    ["Meera Iyer", "meera@uni.edu", "STU004"],
    ["Rohan Gupta", "rohan@uni.edu", "STU005"],
  ];

  const studentIds = [];
  for (const [name, email, studentId] of names) {
    const res = await query(
      `INSERT INTO users (name, email, password_hash, role, student_id)
       VALUES ($1, $2, $3, 'student', $4) RETURNING id`,
      [name, email, studentHash, studentId]
    );
    studentIds.push(res.rows[0].id);
  }

  const groupA = await query(
    `INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING id`,
    ["Team Nova", studentIds[0]]
  );
  const groupB = await query(
    `INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING id`,
    ["Team Orion", studentIds[3]]
  );

  await query(
    `INSERT INTO group_members (group_id, user_id) VALUES
     ($1, $2), ($1, $3), ($1, $4), ($5, $6), ($5, $7)`,
    [
      groupA.rows[0].id,
      studentIds[0],
      studentIds[1],
      studentIds[2],
      groupB.rows[0].id,
      studentIds[3],
      studentIds[4],
    ]
  );

  const dueSoon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const dueLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const a1 = await query(
    `INSERT INTO assignments (title, description, due_date, onedrive_link, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      "Full-stack collaboration lab",
      "Build a small feature as a group and upload a short demo plus source zip to OneDrive.",
      dueSoon.toISOString(),
      "https://onedrive.live.com/?id=joineazy-lab-1",
      admin.rows[0].id,
    ]
  );
  await query(
    `INSERT INTO assignment_targets (assignment_id, group_id) VALUES ($1, NULL)`,
    [a1.rows[0].id]
  );

  const a2 = await query(
    `INSERT INTO assignments (title, description, due_date, onedrive_link, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      "API design review",
      "Document REST endpoints and ER choices. Upload PDF to the shared OneDrive folder.",
      dueLater.toISOString(),
      "https://onedrive.live.com/?id=joineazy-api-review",
      admin.rows[0].id,
    ]
  );
  await query(
    `INSERT INTO assignment_targets (assignment_id, group_id) VALUES ($1, $2)`,
    [a2.rows[0].id, groupA.rows[0].id]
  );

  await query(
    `INSERT INTO submission_confirmations (assignment_id, group_id, user_id)
     VALUES ($1, $2, $3), ($1, $2, $4)`,
    [a1.rows[0].id, groupA.rows[0].id, studentIds[0], studentIds[1]]
  );
}

export async function initSchema() {
  await query(DDL);
  await seed();
}
