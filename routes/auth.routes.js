const express = require("express");
const router = express.Router();

const { login, verifyToken, createAdmin } = require("../controllers/auth.controller");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// Public routes (no authentication required)
router.post("/login", login);

// Protected routes (authentication + super_admin role required)
router.post("/create-admin", Authenticated, authorizeRoles("super_admin"), createAdmin);
router.get("/verify-token", Authenticated, verifyToken);

module.exports = router;
