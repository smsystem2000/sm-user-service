const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./configs/db');
const teacherRoutes = require('./routes/teacher.routes');
const studentRoutes = require('./routes/student.routes');
const parentRoutes = require('./routes/parent.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// School-specific user routes (stored in school databases)
app.use('/api/school/:schoolId/teachers', teacherRoutes);
app.use('/api/school/:schoolId/students', studentRoutes);
app.use('/api/school/:schoolId/parents', parentRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});
app.get("/", (_req, res) => {
    res.send(`🚀 Server is running Securely`);
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to database:', error.message);
        process.exit(1);
    });

module.exports = app;
