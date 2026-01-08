const mongoose = require("mongoose");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const leaveRequestSchema = require("../models/leave-request.model");

// Helper to get the model for a specific school
const getLeaveModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("LeaveRequest", leaveRequestSchema);
};

// Generate unique leave ID
const generateLeaveId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `LV${timestamp}${random}`.toUpperCase();
};

/**
 * Apply for leave (Student/Teacher)
 * POST /api/school/:schoolId/leave/apply
 */
const applyLeave = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const {
            leaveType,
            startDate,
            endDate,
            reason,
            classId,
            sectionId,
        } = req.body;

        // Get applicant info from token
        const applicantId = req.user?.studentId || req.user?.teacherId || req.user?.userId;
        const applicantType = req.user?.role === "teacher" ? "teacher" : "student";
        const applicantName = req.user?.name || req.user?.firstName || "Unknown";

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({
                success: false,
                message: "leaveType, startDate, endDate, and reason are required",
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            return res.status(400).json({
                success: false,
                message: "End date cannot be before start date",
            });
        }

        const LeaveModel = await getLeaveModel(schoolId);

        const newLeave = new LeaveModel({
            leaveId: generateLeaveId(),
            schoolId,
            applicantId,
            applicantType,
            applicantName,
            classId,
            sectionId,
            leaveType,
            startDate: start,
            endDate: end,
            reason,
            status: "pending",
        });

        await newLeave.save();

        res.status(201).json({
            success: true,
            message: "Leave application submitted successfully",
            data: newLeave,
        });
    } catch (error) {
        console.error("Error applying leave:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit leave application",
            error: error.message,
        });
    }
};

/**
 * Get my leave requests (Student/Teacher)
 * GET /api/school/:schoolId/leave/my
 */
const getMyLeaves = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { status, startDate, endDate } = req.query;

        const applicantId = req.user?.studentId || req.user?.teacherId || req.user?.userId;

        const LeaveModel = await getLeaveModel(schoolId);

        const query = { applicantId };
        if (status) query.status = status;
        if (startDate && endDate) {
            query.startDate = { $gte: new Date(startDate) };
            query.endDate = { $lte: new Date(endDate) };
        }

        const leaves = await LeaveModel.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // Summary
        const summary = {
            total: leaves.length,
            pending: leaves.filter((l) => l.status === "pending").length,
            approved: leaves.filter((l) => l.status === "approved").length,
            rejected: leaves.filter((l) => l.status === "rejected").length,
        };

        res.status(200).json({
            success: true,
            data: { leaves, summary },
        });
    } catch (error) {
        console.error("Error getting my leaves:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get leave requests",
            error: error.message,
        });
    }
};

/**
 * Get all leave requests (Admin)
 * GET /api/school/:schoolId/leave/all
 */
const getAllLeaves = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { status, applicantType, startDate, endDate } = req.query;

        const LeaveModel = await getLeaveModel(schoolId);

        const query = {};
        if (status) query.status = status;
        if (applicantType) query.applicantType = applicantType;
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const leaves = await LeaveModel.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // Summary
        const summary = {
            total: leaves.length,
            pending: leaves.filter((l) => l.status === "pending").length,
            approved: leaves.filter((l) => l.status === "approved").length,
            rejected: leaves.filter((l) => l.status === "rejected").length,
            students: leaves.filter((l) => l.applicantType === "student").length,
            teachers: leaves.filter((l) => l.applicantType === "teacher").length,
        };

        res.status(200).json({
            success: true,
            data: { leaves, summary },
        });
    } catch (error) {
        console.error("Error getting all leaves:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get leave requests",
            error: error.message,
        });
    }
};

/**
 * Process leave request (Admin approve/reject)
 * PUT /api/school/:schoolId/leave/:leaveId/process
 */
const processLeave = async (req, res) => {
    try {
        const { schoolId, leaveId } = req.params;
        const { action, remarks } = req.body; // action = 'approve' | 'reject'

        if (!action || !["approve", "reject"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Invalid action. Must be 'approve' or 'reject'",
            });
        }

        const LeaveModel = await getLeaveModel(schoolId);

        const leave = await LeaveModel.findOne({ leaveId });

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found",
            });
        }

        if (leave.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Leave request already ${leave.status}`,
            });
        }

        leave.status = action === "approve" ? "approved" : "rejected";
        leave.processedBy = req.user?.userId || req.user?.adminId;
        leave.processedByName = req.user?.name || req.user?.firstName || "Admin";
        leave.processedAt = new Date();
        leave.approvalRemarks = remarks;

        await leave.save();

        res.status(200).json({
            success: true,
            message: `Leave request ${leave.status}`,
            data: leave,
        });
    } catch (error) {
        console.error("Error processing leave:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process leave request",
            error: error.message,
        });
    }
};

/**
 * Get single leave details
 * GET /api/school/:schoolId/leave/:leaveId
 */
const getLeaveById = async (req, res) => {
    try {
        const { schoolId, leaveId } = req.params;

        const LeaveModel = await getLeaveModel(schoolId);
        const leave = await LeaveModel.findOne({ leaveId }).lean();

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found",
            });
        }

        res.status(200).json({
            success: true,
            data: leave,
        });
    } catch (error) {
        console.error("Error getting leave:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get leave request",
            error: error.message,
        });
    }
};

/**
 * Cancel leave request (Applicant can cancel pending requests)
 * DELETE /api/school/:schoolId/leave/:leaveId
 */
const cancelLeave = async (req, res) => {
    try {
        const { schoolId, leaveId } = req.params;
        const applicantId = req.user?.studentId || req.user?.teacherId || req.user?.userId;

        const LeaveModel = await getLeaveModel(schoolId);
        const leave = await LeaveModel.findOne({ leaveId });

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found",
            });
        }

        // Only the applicant can cancel their own pending request
        if (leave.applicantId !== applicantId) {
            return res.status(403).json({
                success: false,
                message: "You can only cancel your own leave requests",
            });
        }

        if (leave.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Can only cancel pending leave requests",
            });
        }

        await LeaveModel.deleteOne({ leaveId });

        res.status(200).json({
            success: true,
            message: "Leave request cancelled successfully",
        });
    } catch (error) {
        console.error("Error cancelling leave:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel leave request",
            error: error.message,
        });
    }
};

module.exports = {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    processLeave,
    getLeaveById,
    cancelLeave,
};
