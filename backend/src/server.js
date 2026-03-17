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
import http from "http";
import { Server } from "socket.io";
import PDFDocument from "pdfkit";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(__dirname, "../uploads");

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

const prisma = new PrismaClient();
const app = express();

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(STORAGE_DIR));

const upload = multer({ dest: STORAGE_DIR });

const uploadPayslip = multer({ dest: path.join(STORAGE_DIR, "payslips") });
if (!fs.existsSync(path.join(STORAGE_DIR, "payslips"))) fs.mkdirSync(path.join(STORAGE_DIR, "payslips"), { recursive: true });

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
app.post("/api/employees", auth, upload.single("profileImage"), async (req, res) => {
  const data = req.body;
  if (!data.email || !data.password || !data.name)
    return res.status(400).json({ error: "name, email, password required" });

  // Basic validation for other fields
  if (data.dob && isNaN(new Date(data.dob).getTime())) return res.status(400).json({ error: "Invalid date of birth format" });
  if (data.salary && isNaN(Number(data.salary))) return res.status(400).json({ error: "Invalid salary format" });

  if (data.dob) data.dob = new Date(data.dob + 'T00:00:00.000Z');
  if (data.salary) data.salary = Number(data.salary);

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
app.put("/api/employees/:id", auth, upload.single("profileImage"), async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };

  if (!id) return res.status(400).json({ error: "Employee ID is required in the URL." });

  // Basic validation for other fields
  if (data.dob && isNaN(new Date(data.dob).getTime())) return res.status(400).json({ error: "Invalid date of birth format" });
  if (data.salary && isNaN(Number(data.salary))) return res.status(400).json({ error: "Invalid salary format" });

  if (data.dob) data.dob = new Date(data.dob + 'T00:00:00.000Z');
  if (data.salary) data.salary = Number(data.salary);

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
    if (status === "Approved") {
      await prisma.notification.create({
        data: {
          userId: leave.userId,
          title: "Leave Approved",
          body: `Your leave from ${leave.from?.toLocaleDateString()} to ${leave.to?.toLocaleDateString()} has been approved.`,
          type: 'leave_approved',
        },
      });
      const user = await prisma.user.findUnique({ where: { id: leave.userId } });
      if (user) io.to(`user:${leave.userId}`).emit('notification', { id: Date.now(), userId: leave.userId, title: "Leave Approved", body: `Your leave from ${leave.from?.toLocaleDateString()} to ${leave.to?.toLocaleDateString()} has been approved.`, type: 'leave_approved', read: false, createdAt: new Date() });
    }
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
  try {
    if (action === "checkin" || action === "checkout") {
      const statusLabel = "Present"; // Assuming checkin/checkout implies presence
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
  } catch (err) {
    console.error("Error processing attendance:", err);
    res.status(500).json({ error: "Failed to process attendance" });
  }
});

// Announcements
app.get("/api/announcements", auth, async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      include: { createdBy: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ announcements });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

app.post("/api/announcements", auth, async (req, res) => {
  const { title, message, audienceRoles = ["all"], audienceDepartments = [] } = req.body;
  if (!title || !message) return res.status(400).json({ error: "Title and message are required" });
  try {
    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        audienceRoles,
        audienceDepartments,
        createdById: req.user.id,
      },
    });
    // Send notifications to audience
    const where = {};
    if (audienceRoles[0] !== "all") where.role = { in: audienceRoles };
    if (audienceDepartments.length) where.department = { in: audienceDepartments };
    const targets = await prisma.user.findMany({ where });
    for (const target of targets) {
      await prisma.notification.create({
        data: {
          userId: target.id,
          title: `New Announcement: ${title}`,
          body: message.slice(0, 100) + '...',
          type: 'new_announcement',
        },
      });
      io.to(`user:${target.id}`).emit('notification', { id: Date.now(), userId: target.id, title: `New Announcement: ${title}`, body: message.slice(0, 100) + '...', type: 'new_announcement', read: false, createdAt: new Date() });
    }
    res.json({ announcement });
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

// Socket.io logic
const authSocket = async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Missing token"));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return next(new Error("User not found"));
    socket.user = user;
    socket.join(`user:${user.id}`);
    console.log(`Socket auth OK for ${user.name}`);
    next();
  } catch {
    next(new Error("Invalid token"));
  }
};

io.use(authSocket);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.user.id}`);

  socket.on("joinChat", (roomKey) => socket.join(roomKey));

  socket.on("chat message", async ({ roomKey, text }) => {
    if (!text.trim()) return;
    const message = await prisma.chatMessage.create({
      data: {
        type: "direct",
        contactId: roomKey,
        text: text.trim(),
        fromId: socket.user.id,
        toUserId: roomKey.includes(socket.user.id) ? roomKey.replace(socket.user.id + ':', '').replace(':', '') : null,
      },
      include: { from: true },
    });
    const msgData = {
      id: message.id,
      text: message.text,
      from: { id: message.from.id, name: message.from.name },
      createdAt: message.createdAt,
    };
    io.to(roomKey).emit("chat message", msgData);
  });

  socket.on("disconnect", () => console.log(`Socket disconnected: ${socket.user?.id}`));
});

// Chat helpers
const directRoom = (userA, userB) => [userA, userB].sort().join(":");

app.get("/api/chat", auth, async (req, res) => {
  const { contactId, type } = req.query;
  if (!contactId || !type) return res.status(400).json({ error: "contactId and type required" });
  let roomKey = contactId;
  if (type === "direct") roomKey = directRoom(req.user.id, contactId);
  try {
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
  } catch (err) {
    console.error("Error fetching chat messages:", err);
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
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
  try {
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
ls
    });
  } catch (err) {
    console.error("Error creating chat message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Notifications
app.get("/api/notifications", auth, async (req, res) => {
  const { read } = req.query;
  const where = { userId: req.user.id };
  if (read !== undefined) where.read = read === 'true';
  try {
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post("/api/notifications", auth, async (req, res) => {
  const { title, body, type, targetUserId } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' });
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId || req.user.id,
        title,
        body,
        type,
      }
    });
    // Emit to target user room
    io.to(`user:${notification.userId}`).emit('notification', notification);
    res.status(201).json({ notification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

app.put("/api/notifications/:id/read", auth, async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true }
    });
    res.json({ notification });
  } catch (err) {
    res.status(404).json({ error: 'Notification not found' });
  }
});

// Payroll
app.get("/api/payroll", auth, async (req, res) => {
  const { employeeId, month } = req.query;
  const where = {};
  if (employeeId) where.employeeId = employeeId;
  if (month) where.month = month;
  try {
    const payrolls = await prisma.payroll.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ payrolls });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payroll' });
  }
});

app.post("/api/payroll/generate", auth, async (req, res) => {
  const { employeeId, month, baseSalary, deductions = 0 } = req.body;
  if (!employeeId || !month) return res.status(400).json({ error: 'employeeId and month required' });
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  const netPay = (baseSalary || employee.salary || 0) - parseFloat(deductions);
  const filename = `payslip-${uuidv4()}.pdf`;
  const filePath = path.join(STORAGE_DIR, 'payslips', filename);
  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);
  doc.fontSize(24).text('EGI Payslip', 50, 50);
  doc.fontSize(12).text(`Employee: ${employee.name}`, 50, 100);
  doc.text(`ID: ${employee.employeeId || 'N/A'}`, 50, 120);
  doc.text(`Month: ${month}`, 50, 140);
  doc.text(`Base Salary: $${baseSalary || employee.salary || 0}`, 50, 160);
  doc.text(`Deductions: $${deductions}`, 50, 180);
  doc.text(`Net Pay: $${netPay.toFixed(2)}`, 50, 200, { underline: true });
  doc.end();
  writeStream.on('finish', async () => {
    const payroll = await prisma.payroll.upsert({
      where: { employeeId_month: { employeeId, month } },
      update: { baseSalary: parseFloat(baseSalary || employee.salary || 0), deductions: parseFloat(deductions), netPay, pdfPath: `/uploads/payslips/${filename}` },
      create: { employeeId, month, baseSalary: parseFloat(baseSalary || employee.salary || 0), deductions: parseFloat(deductions), netPay, pdfPath: `/uploads/payslips/${filename}` }
    });
    // Notify employee
    io.to(`user:${employeeId}`).emit('notification', {
      id: Date.now(),
      userId: employeeId,
      title: 'Payslip Ready',
      body: `Your payslip for ${month} is available.`,
      type: 'payroll_ready',
      read: false,
      createdAt: new Date()
    });
    res.json({ payroll });
  });
});

// Performance Reviews
app.get("/api/reviews", auth, async (req, res) => {
  const { revieweeId } = req.query;
  const where = revieweeId ? { revieweeId } : {};
  if (req.user.role !== 'root' && req.user.role !== 'admin' && req.user.role !== 'hr') {
    where.reviewerId = req.user.id; // Own reviews
  }
  try {
    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewee: { select: { id: true, name: true, department: true } },
        reviewer: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ reviews });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

app.post("/api/reviews", auth, async (req, res) => {
  const { revieweeId, rating, feedback, reviewDate } = req.body;
  if (!revieweeId || !rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Valid revieweeId and rating (1-5) required" });
  if (revieweeId === req.user.id) return res.status(400).json({ error: "Cannot review self" });
  const reviewee = await prisma.user.findUnique({ where: { id: revieweeId } });
  if (!reviewee) return res.status(404).json({ error: "Reviewee not found" });
  // Role check: manager/hr can review
  if (!['manager', 'hr', 'admin', 'root'].includes(req.user.role)) return res.status(403).json({ error: "Insufficient permissions" });
  try {
    const review = await prisma.review.create({
      data: {
        revieweeId,
        reviewerId: req.user.id,
        rating: Number(rating),
        feedback,
        reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
      }
    });
    res.status(201).json({ review });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ error: "Failed to create review" });
  }
});

app.put("/api/reviews/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { rating, feedback, reviewDate } = req.body;
  if (rating && (rating < 1 || rating > 5)) return res.status(400).json({ error: "Rating must be 1-5" });
  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: "Review not found" });
    if (review.reviewerId !== req.user.id && !['admin', 'root'].includes(req.user.role)) return res.status(403).json({ error: "Not authorized" });
    const updated = await prisma.review.update({
      where: { id },
      data: { rating: Number(rating), feedback, reviewDate: reviewDate ? new Date(reviewDate) : review.reviewDate }
    });
    res.json({ review: updated });
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({ error: "Failed to update review" });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));


app.use((err, req, res, next) => {
  console.error(err.stack);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({ error: "An internal server error occurred." });
});

httpServer.listen(PORT, async () => {
  await ensureRootSeed();
  console.log(`API + Socket.io listening on http://localhost:${PORT}`);
});
