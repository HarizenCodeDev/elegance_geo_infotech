ok
# Phase 7 Leave Management - Implementation Plan

**Current:** Backend running, root login works, basic leave endpoints exist.

**Information Gathered:**
- Leave model: Complete w/ approval fields (verified schema.prisma)
- Basic endpoints: GET/POST/PUT exist (server.js)
- Missing: Full workflow, overlapping validation, dashboard

**Plan:**
1. Backend: Complete approval workflow (level1/level2)
2. Frontend: Leave apply/approval UI
3. Validation: Overlapping leaves, date rules

**Dependent Files:** 
- backend/src/server.js (endpoints)
- Frontend/src/components/LeavesList.jsx (exists)
- Frontend/src/pages/AdminDashboard.jsx

**Followup:** Test workflow → Phase 8 Dashboard

Approve to proceed?
