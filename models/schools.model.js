const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolName: {
            type: String,
            required: true,
        },
        schoolLogo: {
            type: String,
        },
        schoolDbName: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        schoolAddress: {
            type: String,
        },
        schoolEmail: {
            type: String,
        },
        schoolContact: {
            type: String,
        },
        schoolWebsite: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("School", schoolSchema);
