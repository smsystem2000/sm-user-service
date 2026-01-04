const User = require("../models/users.model");

// Helper function to generate userId
const generateUserId = async () => {
    const lastUser = await User.findOne().sort({ userId: -1 });

    if (!lastUser || !lastUser.userId) {
        return "USR00001";
    }

    const lastIdNumber = parseInt(lastUser.userId.replace("USR", ""), 10);
    const newIdNumber = lastIdNumber + 1;

    return `USR${String(newIdNumber).padStart(5, "0")}`;
};

// Create User
const createUser = async (req, res) => {
    try {
        const { username, email, password, role, schoolId, contactNumber } = req.body;

        // Validate input
        if (!username || !email || !password || !schoolId) {
            return res.status(400).json({
                success: false,
                message: "Username, email, password, and schoolId are required",
            });
        }

        // Check if username or email already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }],
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Username or email already exists",
            });
        }

        // Generate userId
        const userId = await generateUserId();

        const newUser = new User({
            userId,
            username,
            email,
            password, // Plain text for now
            role: role || "sch_admin",
            schoolId,
            contactNumber,
        });

        const savedUser = await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: {
                userId: savedUser.userId,
                username: savedUser.username,
                email: savedUser.email,
                role: savedUser.role,
                schoolId: savedUser.schoolId,
                contactNumber: savedUser.contactNumber,
            },
        });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating user",
            error: error.message,
        });
    }
};

// Get User by userId
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({ userId }).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: user,
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching user",
            error: error.message,
        });
    }
};

// Get all Users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: users,
            count: users.length,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error.message,
        });
    }
};

// Update User by userId
const updateUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        // Prevent updating userId
        delete updateData.userId;

        const updatedUser = await User.findOneAndUpdate(
            { userId },
            updateData,
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating user",
            error: error.message,
        });
    }
};

module.exports = {
    createUser,
    getUserById,
    getAllUsers,
    updateUserById,
};
