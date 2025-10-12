const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ quiet: true });
const cors = require('cors');

const app = express();

// Use a global variable to cache the database connection
let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb) {
        console.log('✅ Using existing database connection');
        return cachedDb;
    }
    try {
        console.log('⏳ Creating a new database connection...');
        const conn = await mongoose.connect(process.env.MONGO_URI);
        cachedDb = conn;
        console.log(`✅ [DB] Connected to ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('❌ [DB] Connection error:', error.message);
        throw error;
    }
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Import routers
const userRouter = require('./routes/userRouter');
const feeRouter = require('./routes/feeRouter');
const cronRouter = require('./routes/cronRouter');
const searchRouter = require('./routes/searchRouter');

// Standard route registration
app.use('/', userRouter);        // /register, /login etc.
app.use('/fees', feeRouter);
app.use('/cron', cronRouter);
app.use('/search', searchRouter);

// Optional warm route
app.get('/warm', (req, res) => {
    const token = req.query.token;
    if (token !== process.env.CRON_SECRET) return res.status(403).send('Forbidden');
    res.status(200).send('OK');
});

// Serve frontend for all other GET requests
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Connect to DB and start server locally
// (async () => {
//     try {
//         await connectToDatabase();
//         const port = process.env.PORT || 5000;
//         app.listen(port, () => console.log(`Server running on port ${port}`));
//     } catch (err) {
//         console.error('Failed to connect to DB:', err.message);
//     }
// })();

// Export for Vercel serverless deployment
module.exports = async (req, res) => {
    try {
        await connectToDatabase();
        return app(req, res);
    } catch (error) {
        console.error('Database connection failed:', error.message);
        res.status(500).send('Database connection failed.');
    }
};
