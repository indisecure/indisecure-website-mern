const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
app.use(cors());
const connectDB = require('./db');
connectDB();
app.use(express.json());
const userRouter=require('./routes/userRouter')
app.use('/',userRouter)
const feeRouter=require('./routes/feeRouter')
app.use('/fees',feeRouter)
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
const startReminderCron = require('./utils/croneReminder');
startReminderCron(); 

app.listen(process.env.PORT, () => {
  console.log(`Running on port ${process.env.PORT }`);
});

module.exports= (req,res)=>app(req,res)

//node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"