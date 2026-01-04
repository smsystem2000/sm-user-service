const express = require("express");
const router = express.Router();

const {
    createSchool,
    getSchoolById,
    getAllSchools,
    updateSchoolById,
} = require("../controllers/school.controller");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// Apply authentication and authorization to all routes
router.use(Authenticated);
router.use(authorizeRoles("super_admin"));

// Create a new school
router.post("/create-school", createSchool);

// Get all schools
router.get("/get-all-schools", getAllSchools);

// Get school by schoolId
router.get("/get-school/:schoolId", getSchoolById);

// Update school by schoolId
router.put("/update-school/:schoolId", updateSchoolById);

module.exports = router;
