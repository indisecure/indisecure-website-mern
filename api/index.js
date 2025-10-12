const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ quiet: true });

const cors = require('cors');

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

const userRouter = require('./routes/userRouter');
app.use('/', userRouter);

const feeRouter = require('./routes/feeRouter');
app.use('/fees', feeRouter);

app.get('/warm', (req, res) => {
    const token = req.query.token;
    if (token !== process.env.CRON_SECRET) {
        return res.status(403).send('Forbidden');
    }
    res.status(200).send('OK');
});

const cronRouter = require('./routes/cronRouter');
app.use('/cron', cronRouter);

const searchRouter=require('./routes/searchRouter')
app.use('/search',searchRouter)

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// (async () => {  
// await connectToDatabase();
// app.listen(process.env.PORT, () => {
//     console.log('Server Running on Port ' + process.env.PORT);
// })
// })()

// The main Vercel serverless function entry point


module.exports = async (req, res) => {
    try {
        await connectToDatabase();
        return app(req, res);
    } catch (error) {        
        res.status(500).send('Database connection failed.');
    }
};
