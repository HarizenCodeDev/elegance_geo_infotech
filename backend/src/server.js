import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(__dirname, "../uploads");

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(STORAGE_DIR));

const upload = multer({ dest: STORAGE_DIR });

const roles = ["developer", "teamlead", "manager", "hr", "admin", "root"];

// helpers
const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: "7d",
  });

const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing token" });
  const token = header.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const ensureRootSeed = async () => {
  const count = await prisma.user.count();
  if (count === 0) {
    const passwordHash = await bcrypt.hash("root123", 10);
    await prisma.user.create({
      data: {
        name: "Root User",
        email: "root@egi.local",
        passwordHash,
        role: "root",
        employeeId: "ROOT-001",
        department: "Admin",
      },
    });
    console.log("Seeded default root user: root@egi.local / root123");
  }
};

// Auth routes
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" }); // Password mismatch

  try {
    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    console.error("Error signing token:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
});
app.get("/api/auth/me", auth, async (req, res) => {
  res.json({ user: req.user });
});

app.put("/api/auth/change-password", auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: "Missing passwords" });
  const ok = await bcrypt.compare(oldPassword, req.user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Old password incorrect" }); // Old password mismatch

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    res.json({ message: "Password changed" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});
app.post("/api/auth/forgot-password", async (req, res) => {
  // Stub: in real app, notify admin/root; here we just respond success
  res.json({ message: "Request received" });
});
app.post("/api/auth/avatar", auth, upload.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File required" });
  try {
    const url = `/uploads/${req.file.filename}`;
    await prisma.user.update({ where: { id: req.user.id }, data: { profileImage: url } });
    res.json({ avatarUrl: url });
  } catch (err) {
    console.error("Error updating avatar:", err);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
});
// Employees
app.get("/api/employees", auth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ users });
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});
app.post("/api/employees", auth, async (req, res) => {
  const data = req.body;
  if (!data.email || !data.password || !data.name)
    return res.status(400).json({ error: "name, email, password required" });

  // Basic validation for other fields
  if (data.dob && isNaN(new Date(data.dob).getTime())) return res.status(400).json({ error: "Invalid date of birth format" });
  if (data.salary && isNaN(Number(data.salary))) return res.status(400).json({ error: "Invalid salary format" });

  try {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const role = roles.includes(data.role) ? data.role : "developer";
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role,
        employeeId: data.employeeId || null,
        dob: data.dob ? new Date(data.dob) : null,
        gender: data.gender || null,
        maritalStatus: data.maritalStatus || null,
        department: data.department || null,
        salary: data.salary ? Number(data.salary) : null,
        profileImage: data.profileImage || null,
      },
    });
    res.status(201).json({ user }); // Use 201 for resource creation
  } catch (err) {
    if (err.code === 'P2002') { // Unique constraint violation (e.g., duplicate email)
      return res.status(409).json({ error: `User with email '${data.email}' already exists.` });
    }
    console.error("Error creating employee:", err);
    res.status(500).json({ error: "Failed to create employee" });
  }
});
app.put("/api/employees/:id", auth, async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };

  if (!id) return res.status(400).json({ error: "Employee ID is required in the URL." });

  // Basic validation for other fields
  if (data.dob && isNaN(new Date(data.dob).getTime())) return res.status(400).json({ error: "Invalid date of birth format" });
  if (data.salary && isNaN(Number(data.salary))) return res.status(400).json({ error: "Invalid salary format" });

  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }
  if (data.role && !roles.includes(data.role)) delete data.role;

  try {
    const user = await prisma.user.update({ where: { id }, data });
    res.json({ user });
  } catch (error) {
    // Prisma's error code for "Record to update not found"
    if (error.code === "P2025") {
      return res.status(404).json({ error: `User with ID ${id} not found.` });
    }
    console.error("Failed to update employee:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});
// Leaves
app.get("/api/leaves", auth, async (req, res) => {
  try {
    const leaves = await prisma.leave.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ leaves });
  } catch (err) {
    console.error("Error fetching leaves:", err);
    res.status(500).json({ error: "Failed to fetch leaves" });
  }
});
app.post("/api/leaves", auth, async (req, res) => {
  const { type, from, to, description } = req.body;
  if (from && isNaN(new Date(from).getTime())) return res.status(400).json({ error: "Invalid 'from' date format" });
  if (to && isNaN(new Date(to).getTime())) return res.status(400).json({ error: "Invalid 'to' date format" });

  try {
    const leave = await prisma.leave.create({
      data: {
        userId: req.user.id,
        type: type || "General",
        from: from ? new Date(from) : null,
        to: to ? new Date(to) : null,
        description: description || null,
      },
    });
    res.status(201).json({ leave });
  } catch (err) {
    console.error("Error creating leave request:", err);
    res.status(500).json({ error: "Failed to create leave request" });
  }
});
app.put("/api/leaves/:id/status", auth, async (req, res) => {
  const { status } = req.body;
  const allowed = ["Pending", "Approved", "Rejected"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Bad status" });

  try {
    const leave = await prisma.leave.update({ where: { id: req.params.id }, data: { status } });
    res.json({ leave });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: `Leave request with ID ${req.params.id} not found.` });
    }
    console.error("Error updating leave status:", err);
    res.status(500).json({ error: "Failed to update leave status" });
  }
});
// Attendance
app.get("/api/attendance", auth, async (req, res) => {
  const { date, from, to } = req.query;
  let where = {};
  if (date) {
    const d = new Date(date);
    where.date = d;
  } else if (from && to) {
    where.date = { gte: new Date(from), lte: new Date(to) };
  }

  try {
    const records = await prisma.attendance.findMany({
      where,
      include: { user: true },
      orderBy: { date: "desc" },
    });
    res.json({ records });
  } catch (err) {
    console.error("Error fetching attendance records:", err);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});
app.post("/api/attendance", auth, async (req, res) => {
  const { userId, status, date, action } = req.body;
  const targetUserId = userId || req.user.id;
  const day = date ? new Date(date) : new Date();
  const isoDay = new Date(day.toISOString().slice(0, 10));

  // Employee self checkin/checkout
  if (action === "checkin" || action === "checkout") {
    const statusLabel = action === "checkin" ? "Present" : "Present";
    const data = {
      userId: targetUserId,
      date: isoDay,
      status: statusLabel,
      checkInAt: action === "checkin" ? new Date() : undefined,
      checkOutAt: action === "checkout" ? new Date() : undefined,
    };
    const record = await prisma.attendance.upsert({
      where: { userId_date: { userId: targetUserId, date: isoDay } },
      update: {
        status: data.status,
        checkInAt: data.checkInAt ?? undefined,
        checkOutAt: data.checkOutAt ?? undefined,
      },
      create: data,
    });
    return res.json({ record });
  }

  // Admin sets status
  if (!status) return res.status(400).json({ error: "status required" });
  const record = await prisma.attendance.upsert({
    where: { userId_date: { userId: targetUserId, date: isoDay } },
    update: { status },
    create: { userId: targetUserId, date: isoDay, status },
  });
  res.json({ record });
});

// Announcements
app.get("/api/announcements", auth, async (req, res) => {
  const announcements = await prisma.announcement.findMany({
    include: { createdBy: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ announcements });
});

app.post("/api/announcements", auth, async (req, res) => {
  const { title, message, audienceRoles = ["all"], audienceDepartments = [] } = req.body;
  const announcement = await prisma.announcement.create({
    data: {
      title,
      message,
      audienceRoles,
      audienceDepartments,
      createdById: req.user.id,
    },
  });
  res.json({ announcement });
});

// Chat helpers
const directRoom = (userA, userB) => [userA, userB].sort().join(":");

app.get("/api/chat", auth, async (req, res) => {
  const { contactId, type } = req.query;
  if (!contactId || !type) return res.status(400).json({ error: "contactId and type required" });
  let roomKey = contactId;
  if (type === "direct") roomKey = directRoom(req.user.id, contactId);
  const messages = await prisma.chatMessage.findMany({
    where: { type, contactId: roomKey },
    include: { from: true },
    orderBy: { createdAt: "asc" },
  });
  const formatted = messages.map((m) => ({
    id: m.id,
    text: m.text,
    author: m.from.name,
    from: { _id: m.from.id, name: m.from.name },
  }));
  res.json({ messages: formatted });
});

app.post("/api/chat", auth, async (req, res) => {
  const { contactId, type, text } = req.body;
  if (!contactId || !type || !text) return res.status(400).json({ error: "contactId, type, text required" });
  let roomKey = contactId;
  let toUserId = null;
  if (type === "direct") {
    roomKey = directRoom(req.user.id, contactId);
    toUserId = contactId;
  }
  const message = await prisma.chatMessage.create({
    data: {
      type,
      contactId: roomKey,
      text,
      fromId: req.user.id,
      toUserId,
    },
    include: { from: true },
  });
  res.json({
    message: {
      id: message.id,
      text: message.text,
      author: message.from.name,
      from: { _id: message.from.id, name: message.from.name },
    },
  });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, async () => {
  await ensureRootSeed();
  console.log(`API listening on http://localhost:${PORT}`);
});
