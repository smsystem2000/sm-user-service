const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");

// Admin Login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required",
            });
        }

        // Find admin by username
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
        }

        // Compare password (plain text for now)
        if (password !== admin.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
        }

        // Generate JWT token with adminId, username, role
        const token = jwt.sign(
            {
                adminId: admin.adminId,
                username: admin.username,
                role: admin.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
                admin: {
                    adminId: admin.adminId,
                    username: admin.username,
                    role: admin.role,
                },
            },
        });
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({
            success: false,
            message: "Error during login",
            error: error.message,
        });
    }
};

// Verify Token (optional - for checking token validity)
const verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return res.status(200).json({
            success: true,
            message: "Token is valid",
            data: {
                adminId: decoded.adminId,
                username: decoded.username,
                role: decoded.role,
            },
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
// Helper function to generate adminId
const generateAdminId = async () => {
    const lastAdmin = await Admin.findOne().sort({ adminId: -1 });

    if (!lastAdmin || !lastAdmin.adminId) {
        return "ADM00001";
    }

    const lastIdNumber = parseInt(lastAdmin.adminId.replace("ADM", ""), 10);
    const newIdNumber = lastIdNumber + 1;

    return `ADM${String(newIdNumber).padStart(5, "0")}`;
};

// Create Admin
const createAdmin = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required",
            });
        }

        // Check if username already exists
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Username already exists",
            });
        }

        // Generate adminId
        const adminId = await generateAdminId();

        // Store password (plain text for now - add bcrypt later for production)
        const newAdmin = new Admin({
            adminId,
            username,
            password,
            role: role || "super_admin",
        });

        const savedAdmin = await newAdmin.save();

        return res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: {
                adminId: savedAdmin.adminId,
                username: savedAdmin.username,
                role: savedAdmin.role,
            },
        });
    } catch (error) {
        console.error("Error creating admin:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating admin",
            error: error.message,
        });
    }
};

module.exports = {
    login,
    verifyToken,
    createAdmin,
};
