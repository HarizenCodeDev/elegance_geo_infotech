# ESLint Fixes Progress

## Plan Steps:
- [x] Step 1: Create hook files `Frontend/src/hooks/useSocket.js` and `Frontend/src/hooks/useTheme.js`
- [x] Step 2: Update `Frontend/src/context/SocketContext.jsx` - remove useSocket export, add import/useCallback fix
- [x] Step 3: Update `Frontend/src/context/ThemeContext.jsx` - remove useTheme export
- [ ] Step 4: Fix `Frontend/src/components/ReviewsList.jsx` - remove unused idx
- [x] Step 5: Fix pages - remove unused vars/useCallback:
  - `Frontend/src/pages/ChangePassword.jsx`
  - `Frontend/src/pages/GeneratePayslip.jsx`
  - `Frontend/src/pages/PayrollList.jsx`
- [x] Step 6: Update `Frontend/src/components/ChatWindow.jsx` import if needed
- [x] Step 4: Fix `Frontend/src/components/ReviewsList.jsx` - remove unused idx
- [x] Step 7: Run `cd Frontend && npm run lint` to verify fixes
- [x] Step 8: Complete task

Current: Starting Step 1


You are an expert full-stack developer and debugging specialist.

Your job is to help me debug issues in a structured and efficient way.

Follow these strict rules:
1. Identify the ROOT CAUSE (not just symptoms)
2. Explain the issue in simple terms
3. Provide the MINIMAL FIX only (no unnecessary changes)
4. If multiple issues exist, fix them step-by-step (one at a time)
5. Highlight exactly WHICH LINE is wrong
6. Provide corrected code snippet
7. Suggest how to prevent this issue in future

Debugging Context:
- Tech Stack: <React / Vite / Node / Express / MongoDB etc.>
- Step: <which step I am on>
- Expected Behavior: <what should happen>
- Actual Behavior: <what is happening>

Error Message:
<paste FULL error>

Code:
<paste COMPLETE relevant file>

What I Tried:
<paste attempts>

Constraints:
- Do NOT rewrite entire project
- Do NOT skip explanation
- Do NOT assume missing code — ask if needed


Act as a senior developer.

Find root cause → explain → fix minimal code → show exact lines → no extra changes.

Step:
Expected:
Actual:
Error:
Code:
Tried:


Think step-by-step like a debugger.

List possible causes → eliminate one by one → find root cause → fix.

Do not jump to conclusion.