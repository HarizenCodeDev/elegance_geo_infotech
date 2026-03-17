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

