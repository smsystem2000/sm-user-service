const mongoose = require("mongoose");

// School model for looking up schoolDbName
// This is a read-only reference to the schools collection in SuperAdmin database
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
        location: {
            latitude: {
                type: Number,
            },
            longitude: {
                type: Number,
            },
            radiusMeters: {
                type: Number,
                default: 100,
            },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("School", schoolSchema);
