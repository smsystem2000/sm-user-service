const express = require("express");
const router = express.Router({ mergeParams: true }); // To access :schoolId from parent router
const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    processLeave,
    getLeaveById,
    cancelLeave,
} = require("../controllers/leave.controller");
const { checkAuth, checkRole } = require("../middlewares/auth.middleware");

// All routes require authentication
router.use(checkAuth);

// Student/Teacher routes
// Apply for leave
router.post("/apply", applyLeave);

// Get my leave requests
router.get("/my", getMyLeaves);

// Get specific leave by ID
router.get("/:leaveId", getLeaveById);

// Cancel pending leave (own request only)
router.delete("/:leaveId", cancelLeave);

// Admin routes
// Get all leave requests
router.get("/all", checkRole(["sch_admin"]), getAllLeaves);

// Process (approve/reject) leave
router.put("/:leaveId/process", checkRole(["sch_admin"]), processLeave);

module.exports = router;
