# PHASE 8: DASHBOARD SYSTEM - Implementation Plan

**Current Status:** Basic dashboards exist (AdminDashboard.jsx, EmployeeDashboard.jsx, RootDashboard.jsx)

**Information Gathered:**
- AdminDashboard.jsx: Stats cards, sidebar menu, current views (addEmployee, attendance, etc.)
- EmployeeDashboard.jsx: Personal stats, leaves, attendance
- Backend /api/stats: Live data (totalUsers, present/absent, leaves, late punches)
- Backend running, APIs responsive

**Plan:**
1. **Root Dashboard:** Full control + reset requests + reports
2. **Admin/Manager/HR:** Leave approvals (add LeaveApproval), Excel export button
3. **Employee:** Yearly stats (leaves, punches), payslips list
4. **UI:** Role-based sidebars, loading states

**Files to Edit:**
- Frontend/src/pages/RootDashboard.jsx
- Frontend/src/pages/AdminDashboard.jsx  
- Frontend/src/pages/EmployeeDashboard.jsx
- Frontend/src/components/AttendanceChart.jsx (enhance)

**Followup:** Test all roles → Phase 9 Chat improvements

Approve plan?
