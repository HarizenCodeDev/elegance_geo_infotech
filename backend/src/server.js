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

const onlineUsers = {};

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(STORAGE_DIR));

const upload = multer({ dest: STORAGE_DIR });

const uploadPayslip = multer({ dest: path.join(STORAGE_DIR, "payslips") });
if (!fs.existsSync(path.join(STORAGE_DIR, "payslips"))) fs.mkdirSync(path.join(STORAGE_DIR, "payslips"), { recursive: true });

const roles = ["developer", "teamlead", "manager", "hr", "admin", "root"];
const roleHierarchy = {
  developer: 0,
  teamlead: 1,
  manager: 2,
  hr: 2,
  admin: 3,
  root: 4
};

// helpers
const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: "7d",
  });

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires one of: ${allowedRoles.join(', ')}` });
    }
    next();
  };
};

const authorizeRootOnly = (req, res, next) => {
  if (req.user.role !== 'root') return res.status(403).json({ error: "Root access required" });
  next();
};

const authorizeSelfOrHigher = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role === 'root' || req.user.role === 'admin') return next();
    if (req.body[userIdField] !== req.user.id && req.params.id !== req.user.id) {
      return res.status(403).json({ error: "Can only access own data" });
    }
    next();
  };
};

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
app.post("/api/auth/reset-password", async (req, res) => {
  const { token, newPassword, email } = req.body;
  if (!token || !newPassword || !email) return res.status(400).json({ error: "token, newPassword, email required" });

  try {
    const request = await prisma.passwordRequest.findFirst({
      where: { 
        token, 
        email, 
        used: false,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });
    if (!request || !request.user) return res.status(404).json({ error: "Invalid or expired token" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: request.userId }, data: { passwordHash } }),
      prisma.passwordRequest.update({ where: { id: request.id }, data: { used: true } })
    ]);

    await prisma.auditLog.create({
        data: {
            userId: request.userId,
            action: 'PASSWORD_RESET',
            entity: 'User',
            entityId: request.userId,
            oldValues: { passwordChanged: false },
            newValues: { passwordChanged: true },
            ipAddress: req.ip || 'unknown',
        }
    });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

app.post("/api/auth/root-reset", auth, async (req, res) => {
  if (req.user.role !== 'root') return res.status(403).json({ error: "Root only" });
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ error: "email, newPassword required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: "User not found" });

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash, firstLogin: true } });
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'ROOT_PASSWORD_RESET',
        entity: 'User',
        entityId: user.id,
        newValues: { email: user.email },
        ipAddress: req.ip || 'unknown'
      }
    });
    res.json({ message: `Password reset for ${email}. First login required.` });
  } catch (err) {
    console.error("Error root reset:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

app.get("/api/password-requests", auth, authorizeRootOnly, async (req, res) => {
  try {
    const requests = await prisma.passwordRequest.findMany({
      where: {
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json({ requests });
  } catch (err) {
    console.error("Error fetching password requests:", err);
    res.status(500).json({ error: "Failed to fetch password requests" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  try {
    const token = signToken({
      ...user,
      forcePasswordChange: user.firstLogin || user.forcePasswordChange
    });
    res.json({ 
      token, 
      user: {
        ...user,
        forcePasswordChange: user.firstLogin || user.forcePasswordChange
      } 
    });
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
  if (!ok) return res.status(401).json({ error: "Old password incorrect" });

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ 
      where: { id: req.user.id }, 
      data: { 
        passwordHash,
        firstLogin: false,
        forcePasswordChange: false 
      } 
    });
    // Log to audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PASSWORD_CHANGED',
        entity: 'User',
        entityId: req.user.id,
        ipAddress: req.ip || 'unknown',
      }
    });
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: "User not found" });

  try {
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.passwordRequest.upsert({
      where: { email },
      update: { token, expiresAt, used: false },
      create: { email, token, expiresAt, used: false, userId: user.id }
    });
    // In prod: Send email with token link to admin/root + notify them
    console.log(`Password reset token for ${email}: ${token} (expires ${expiresAt})`);
    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'PasswordRequest',
        entityId: null,
        oldValues: { email },
        newValues: { email, expiresAt: expiresAt.toISOString() },
        ipAddress: req.ip || 'unknown'
      }
    });
    res.json({ message: "Reset token generated. Check console/admin notification (prod: email sent)" });
  } catch (err) {
    console.error("Error generating reset token:", err);
    res.status(500).json({ error: "Failed to request password reset" });
  }
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
app.get("/api/employees", auth, authorizeRoles('admin', 'root'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({ 
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeId: true,
        department: true,
        profileImage: true,
        createdAt: true
      }
    });
    res.json({ users });
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// Endpoint to get all password reset requests
app.get(
  "/api/password-requests",
  auth,
  authorizeRootOnly,
  async (req, res) => {
    try {
      const requests = await prisma.passwordRequest.findMany({
        where: {
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      res.json({ requests });
    } catch (err) {
      console.error("Error fetching password requests:", err);
      res.status(500).json({ error: "Failed to fetch password requests" });
    }
  }
);

// Get user stats
app.get("/api/user/stats", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const totalLeaves = await prisma.leave.count({
      where: {
        userId: userId,
      },
    });

    const latePunches = await prisma.attendance.count({
      where: {
        userId: userId,
        status: "Late",
      },
    });

    const onTimePunches = await prisma.attendance.count({
      where: {
        userId: userId,
        status: "Present",
      },
    });

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    const totalDays = Math.floor(
      (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
    );

    res.json({
      totalDays,
      totalLeaves,
      latePunches,
      onTimePunches,
    });
  } catch (err) {
    console.error("Error fetching user stats:", err);
    res.status(500).json({ error: "Failed to fetch user stats" });
  }
});

// Get user payslips
app.get("/api/user/payslips", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const payslips = await prisma.payroll.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        month: "desc",
      },
      take: 6,
    });
    res.json({ payslips });
  } catch (err) {
    console.error("Error fetching user payslips:", err);
    res.status(500).json({ error: "Failed to fetch user payslips" });
  }
});

// Generate payslip PDF
app.get("/api/user/payslips/:payrollId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { payrollId } = req.params;

    const payroll = await prisma.payroll.findFirst({
      where: {
        id: payrollId,
        userId: userId,
      },
      include: {
        user: true,
      },
    });

    if (!payroll) {
      return res.status(404).json({ error: "Payslip not found" });
    }

    const doc = new PDFDocument({ margin: 50 });
    const stream = res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment;filename=payslip-${payroll.month}.pdf`,
    });

    doc.on('data', (chunk) => stream.write(chunk));
    doc.on('end', () => stream.end());

    // Add content to the PDF
    doc.fontSize(25).text("Payslip", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text(`Employee: ${payroll.user.name}`);
    doc.text(`Month: ${payroll.month}`);
    doc.moveDown();
    doc.text(`Basic Salary: ${payroll.basicSalary}`);
    doc.text(`Allowances: ${payroll.allowances}`);
    doc.text(`Deductions: ${payroll.deductions}`);
    doc.moveDown();
    doc.fontSize(20).text(`Net Salary: ${payroll.netSalary}`);

    doc.end();
  } catch (err) {
    console.error("Error generating payslip:", err);
    res.status(500).json({ error: "Failed to generate payslip" });
  }
});

// Notifications
app.get("/api/notifications", auth, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.put("/api/notifications/:id/read", auth, async (req, res) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: {
        id: req.params.id,
        userId: req.user.id, // Ensure users can only update their own notifications
      },
      data: { read: true },
    });

    if (notification.count === 0) {
      return res.status(404).json({ error: "Notification not found or not owned by user" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});
app.post("/api/employees", auth, authorizeRoles('admin', 'root'), upload.single("profileImage"), async (req, res) => {
  const data = req.body;
  if (!data.email || !data.name)
    return res.status(400).json({ error: "name, email required" });

  // Generate default password if not provided
  const defaultPw = data.password || `${data.name.toLowerCase()}@123`;
  console.log(`Creating user ${data.name} with default pw: ${defaultPw} (change on first login)`);

  // Basic validation for other fields
  if (data.dob && isNaN(new Date(data.dob).getTime())) return res.status(400).json({ error: "Invalid date of birth format" });
  if (data.salary && isNaN(Number(data.salary))) return res.status(400).json({ error: "Invalid salary format" });

  if (data.dob) data.dob = new Date(data.dob + 'T00:00:00.000Z');
  if (data.salary) data.salary = Number(data.salary);

  try {
    const passwordHash = await bcrypt.hash(defaultPw, 10);
    const role = roles.includes(data.role) ? data.role : "developer";
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role,
        employeeId: data.employeeId || null,
        dob: data.dob,
        gender: data.gender || null,
        maritalStatus: data.maritalStatus || null,
        department: data.department || null,
        salary: data.salary,
        profileImage: req.file ? `/uploads/${req.file.filename}` : null,
        firstLogin: true,
      },
    });
    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_CREATED',
        entity: 'User',
        entityId: user.id,
        newValues: { name: user.name, email: user.email, role: user.role },
        ipAddress: req.ip || 'unknown',
      }
    });
    res.status(201).json({ 
      user,
      defaultPassword: defaultPw // Send for admin notification (remove in prod?)
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: `User with email '${data.email}' already exists.` });
    }
    console.error("Error creating employee:", err);
    res.status(500).json({ error: "Failed to create employee" });
  }
});
app.put("/api/employees/:id", auth, authorizeRoles('admin', 'root'), upload.single("profileImage"), async (req, res) => {
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
    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) return res.status(404).json({ error: `User with ID ${id} not found.` });

    const user = await prisma.user.update({ where: { id }, data });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_UPDATED',
        entity: 'User',
        entityId: user.id,
        oldValues: oldUser,
        newValues: data,
        ipAddress: req.ip || 'unknown',
      }
    });

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
  if (new Date(from) > new Date(to)) return res.status(400).json({ error: "'From' date must be before 'to' date" });

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
app.put("/api/leaves/:id/approve-level1", auth, authorizeRoles('manager', 'hr', 'admin'), async (req, res) => {
  const { comment } = req.body;
  try {
    const leave = await prisma.leave.findUnique({ where: { id: req.params.id }, include: { user: true } });
    if (!leave) return res.status(404).json({ error: "Leave not found" });
    
    if (leave.status !== 'Pending') return res.status(400).json({ error: "Can only approve pending leaves" });
    
    const updated = await prisma.leave.update({
      where: { id: req.params.id },
      data: { 
        status: 'Level1Approved',
        level1_approved_by: req.user.id,
        level1_approved_at: new Date(),
      }
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: leave.userId,
        title: "Leave Level 1 Approved",
        body: `Your leave request has been approved by ${req.user.name} (Level 1).`,
        type: 'leave_level1_approved'
      }
    });
    
    io.to(`user:${leave.userId}`).emit('notification', {
      title: "Leave Level 1 Approved",
      body: `Your leave request has been approved by ${req.user.name} (Level 1).`,
      type: 'leave_level1_approved'
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'LEAVE_APPROVED_L1',
        entity: 'Leave',
        entityId: leave.id,
        oldValues: { status: leave.status },
        newValues: { status: 'Level1Approved', approvedBy: req.user.id },
        ipAddress: req.ip || 'unknown',
      }
    });

    res.json({ leave: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve leave" });
  }
});

// Announcements
app.post("/api/announcements", auth, authorizeRoles('admin', 'manager', 'hr'), async (req, res) => {
  const { title, message, audienceRoles, audienceDepartments } = req.body;
  if (!title || !message) return res.status(400).json({ error: "Title and message are required" });

  try {
    const announcement = await prisma.announcement.create({
      data: {
        createdById: req.user.id,
        title,
        message,
        audienceRoles: audienceRoles || [],
        audienceDepartments: audienceDepartments || [],
      },
    });

    // Notify relevant users
    const usersToNotify = await prisma.user.findMany({
      where: {
        OR: [
          { role: { in: audienceRoles } },
          { department: { in: audienceDepartments } },
        ],
      },
    });

    const notifications = usersToNotify.map(user => ({
      userId: user.id,
      title: `New Announcement: ${title}`,
      body: message.substring(0, 100),
      type: 'new_announcement',
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
      usersToNotify.forEach(user => {
        io.to(`user:${user.id}`).emit('notification', { title: `New Announcement: ${title}`, body: message });
      });
    }

    res.status(201).json({ announcement });
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

app.get("/api/announcements", auth, async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { audienceRoles: { has: req.user.role } },
          { audienceDepartments: { has: req.user.department } },
          { AND: [{ audienceRoles: { isEmpty: true } }, { audienceDepartments: { isEmpty: true } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true, profileImage: true } } },
    });
    res.json({ announcements });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// Chat history
app.get("/api/chat/history", auth, async (req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      orderBy: {
        createdAt: "asc",
      },
      include: {
        sender: {
          select: {
            name: true,
            profileImage: true,
          },
        },
      },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      text: msg.content,
      senderId: msg.senderId,
      timestamp: msg.createdAt,
      sender: msg.sender,
    }));

    res.json({ messages: formattedMessages });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });

  // Example: join a room based on user ID
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined room user:${userId}`);
  });

  // Handle chat messages
  socket.on('message', async (message) => {
    try {
      // Save the message to the database
      const savedMessage = await prisma.chatMessage.create({
        data: {
          content: message.text,
          senderId: message.senderId,
        },
        include: {
          sender: {
            select: {
              name: true,
              profileImage: true
            }
          }
        },
      });

      // Construct the message to broadcast
      const broadcastMessage = {
        id: savedMessage.id,
        text: savedMessage.content,
        senderId: savedMessage.senderId,
        timestamp: savedMessage.createdAt,
        sender: savedMessage.sender
      };

      // Broadcast the message to all clients
      io.emit('message', broadcastMessage);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
});

app.put("/api/leaves/:id/reject-level1", auth, authorizeRoles('manager', 'hr', 'admin'), async (req, res) => {
  const { comment } = req.body;
  try {
    const leave = await prisma.leave.findUnique({ where: { id: req.params.id }, include: { user: true } });
    if (!leave) return res.status(404).json({ error: "Leave not found" });
    
    if (leave.status !== 'Pending') return res.status(400).json({ error: "Can only reject pending leaves" });
    
    const updated = await prisma.leave.update({
      where: { id: req.params.id },
      data: { 
        status: 'Level1Rejected',
        level1_approved_by: req.user.id,
        level1_approved_at: new Date(),
      }
    });

    await prisma.notification.create({
      data: {
        userId: leave.userId,
        title: "Leave Level 1 Rejected", 
        body: `Your leave request was rejected by ${req.user.name}.`,
        type: 'leave_level1_rejected'
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'LEAVE_REJECTED_L1',
        entity: 'Leave',
        entityId: leave.id,
        newValues: { status: 'Level1Rejected', rejectedBy: req.user.id },
        ipAddress: req.ip || 'unknown',
      }
    });

    res.json({ leave: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reject leave" });
  }
});

app.put("/api/leaves/:id/approve-level2", auth, authorizeRoles('root'), async (req, res) => {
  const { comment } = req.body;
  try {
    const leave = await prisma.leave.findUnique({ where: { id: req.params.id }, include: { user: true } });
    if (!leave) return res.status(404).json({ error: "Leave not found" });
    
    if (leave.status !== 'Level1Approved') return res.status(400).json({ error: "Must be Level1 approved first" });
    
    const updated = await prisma.leave.update({
      where: { id: req.params.id },
      data: { 
        status: 'Level2Approved',
        level2_approved_by: req.user.id,
        level2_approved_at: new Date(),
      }
    });

    await prisma.notification.create({
      data: {
        userId: leave.userId,
        title: "Leave Fully Approved",
        body: `Your leave request has been fully approved.`,
        type: 'leave_fully_approved'
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'LEAVE_APPROVED_L2',
        entity: 'Leave',
        entityId: leave.id,
        newValues: { status: 'Level2Approved', approvedBy: req.user.id, comment: comment },
        ipAddress: req.ip || 'unknown',
      }
    });

    res.json({ leave: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve final level" });
  }
});
// Attendance
app.get("/api/attendance/export", auth, authorizeRoles('admin', 'root'), async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to dates required' });
  
  try {
    const records = await prisma.attendance.findMany({
      where: { date: { gte: new Date(from), lte: new Date(to) } },
      include: { user: { select: { id: true, name: true, employeeId: true, department: true } } },
      orderBy: [{ date: 'asc' }, { user: { name: 'asc' } }]
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${from}_to_${to}.xlsx`);
    
    // CSV for simplicity (Excel compatible)
    const csv = [
      ['Date', 'Employee ID', 'Name', 'Department', 'Status', 'Check-in', 'Check-out'],
      ...records.map(r => [
        r.date.toISOString().slice(0, 10),
        r.user.employeeId || '',
        r.user.name,
        r.user.department || '',
        r.status || 'Absent',
        r.checkInAt ? r.checkInAt.toISOString().slice(11, 16) : '',
        r.checkOutAt ? r.checkOutAt.toISOString().slice(11, 16) : ''
      ])
    ].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\\n');
    
    res.send(`sep=,\n${csv}`);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Export failed' });
  }
});

app.get("/api/attendance", auth, async (req, res) => {
  const { date, from, to, userId, month } = req.query;
  let where = {};
  
  if (userId) where.userId = userId;
  if (date) {
    const d = new Date(date);
    where.date = d;
  } else if (month) {
    const [year, mon] = month.split('-');
    const start = new Date(parseInt(year), parseInt(mon) - 1, 1);
    const end = new Date(parseInt(year), parseInt(mon), 0);
    where.date = { gte: start, lte: end };
  } else if (from && to) {
    where.date = { gte: new Date(from), lte: new Date(to) };
  }

  try {
    const [records, summary] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: { user: true },
        orderBy: { date: "desc" },
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      })
    ]);
      res.json({ records, summary });
  } catch (err) {
    console.error("Error fetching attendance records:", err);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});
app.post("/api/attendance/punch", auth, async (req, res) => {
  const { action } = req.body; // 'checkin' or 'checkout'
  if (!['checkin', 'checkout'].includes(action)) return res.status(400).json({ error: "action must be 'checkin' or 'checkout'" });

  const now = new Date();
  const isoDay = new Date(now.toISOString().slice(0, 10));
  const targetUserId = req.user.id; // Self punch only

  // Time window check
  const hour = now.getHours();
  if (action === 'checkin' && (hour < 8 || hour > 11)) {
    return res.status(400).json({ error: "Punch-in allowed only 8AM-11AM" });
  }

  try {
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: targetUserId, date: isoDay } }
    });

    if (action === 'checkin') {
      if (existing?.checkInAt) return res.status(400).json({ error: "Already punched in today" });
      
      const isLate = hour > 9 || (hour === 9 && now.getMinutes() > 30);
      const status = isLate ? 'Late' : 'Present';
      
      const record = await prisma.attendance.upsert({
        where: { userId_date: { userId: targetUserId, date: isoDay } },
        update: { checkInAt: now, status },
        create: { 
          userId: targetUserId, 
          date: isoDay, 
          status,
          checkInAt: now 
        }
      });
      res.json({ record, message: `Punched ${action} ${isLate ? '(Late)' : '(On time)'}` });
    } else { // checkout
      if (!existing || !existing.checkInAt) return res.status(400).json({ error: "Must punch in first" });
      if (existing.checkOutAt) return res.status(400).json({ error: "Already punched out today" });

      const record = await prisma.attendance.update({
        where: { userId_date: { userId: targetUserId, date: isoDay } },
        data: { checkOutAt: now }
      });
      res.json({ record, message: 'Punched out successfully' });
    }
  } catch (err) {
    console.error("Attendance punch error:", err);
    res.status(500).json({ error: "Failed to process punch" });
  }
});

// Admin override (separate endpoint)
app.put("/api/attendance/:id", auth, authorizeRoles('admin', 'root'), async (req, res) => {
  const { status, checkInAt, checkOutAt } = req.body;
  try {
    const record = await prisma.attendance.update({
      where: { id: req.params.id },
      data: { status, checkInAt, checkOutAt }
    });
    res.json({ record });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Attendance record not found' });
    res.status(500).json({ error: "Failed to update attendance" });
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

  socket.on("typing", ({ roomKey, isTyping }) => {
    socket.to(roomKey).emit("typing", { isTyping });
  });

  socket.on("disconnect", () => console.log(`Socket disconnected: ${socket.user?.id}`));
});

// Chat helpers
const directRoom = (userA, userB) => [userA, userB].sort().join(":");

app.get("/api/chat", auth, async (req, res) => {
  const { contactId, type, cursor, limit = 50 } = req.query;
  if (!contactId || !type) return res.status(400).json({ error: "contactId and type required" });
  let roomKey = contactId;
  if (type === "direct") roomKey = directRoom(req.user.id, contactId);
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { type, contactId: roomKey },
      include: { from: true },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
    });
    const formatted = messages.map((m) => ({
      id: m.id,
      text: m.text,
      author: m.from.name,
      from: { _id: m.from.id, name: m.from.name },
      read: m.read,
      createdAt: m.createdAt,
    }));
    res.json({ messages: formatted.reverse() });
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
      }
    });
  } catch (err) {
    console.error("Error creating chat message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.put("/api/chat/messages/:id/read", auth, async (req, res) => {
  try {
    const message = await prisma.chatMessage.updateMany({
      where: {
        id: req.params.id,
        toUserId: req.user.id,
      },
      data: { read: true },
    });

    if (message.count === 0) {
      return res.status(404).json({ error: "Message not found or not owned by user" });
    }

    res.json({ message: "Message marked as read" });
  } catch (err) {
    console.error("Error marking message as read:", err);
    res.status(500).json({ error: "Failed to update message" });
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
app.get("/api/payroll", auth, authorizeRoles('hr', 'admin', 'root'), async (req, res) => {
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

app.post("/api/payroll/generate", auth, authorizeRoles('hr', 'admin', 'root'), async (req, res) => {
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

// Performance Reviews removed

app.get("/api/stats", auth, async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalUsers,
    todayAttendance, 
    todayPresent,
    todayAbsent,
    pendingLeaves,
    approvedLeaves,
    developers,
    latePunches,
    weeklyAttendance
  ] = await Promise.all([
    prisma.user.count(),
    prisma.attendance.count({ where: { date: { gte: today, lt: tomorrow } } }),
    prisma.attendance.count({ where: { 
      date: { gte: today, lt: tomorrow },
      status: "Present" 
    } }),
    prisma.attendance.count({ where: { 
      date: { gte: today, lt: tomorrow },
      status: { not: "Present" } 
    } }),
    prisma.leave.count({ where: { status: "Pending" } }),
    prisma.leave.count({ where: { status: "Approved" } }),
    prisma.user.count({ where: { role: "developer" } }),
    prisma.attendance.count({ where: { 
      date: { gte: today, lt: tomorrow },
      checkInAt: { gt: new Date(today.getTime() + 9*60*60*1000) } // late after 9AM
    } }),
    // Weekly attendance average
    prisma.$queryRaw`
      SELECT to_char(date, 'Dy') label, COUNT(*)::int value 
      FROM "Attendance" 
      WHERE date >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY date ORDER BY date
    `
  ]);

  res.json({
    totalUsers,
    todayAttendance,
    todayPresent, 
    todayAbsent,
    pendingLeaves,
    approvedLeaves,
    developers,
    latePunches,
    weeklyAttendance,
  });
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
  try {
    await ensureRootSeed();
    console.log(`API + Socket.io listening on http://localhost:${PORT}`);
  } catch (err) {
    console.error("Failed to seed root user:", err);
    process.exit(1);
  }
});