const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ quiet: true });

const cors = require('cors');
const connectDB = require('./db');

(async () => {
  await connectDB(); // Ensures DB is connected before proceeding

  app.use(cors());
  app.use(express.json());

  const userRouter = require('./routes/userRouter');
  app.use('/', userRouter);

  const feeRouter = require('./routes/feeRouter');
  app.use('/fees', feeRouter);

  app.use(express.static(path.join(__dirname, 'dist')));

  app.get('/warm', (req, res) => {
    const token = req.query.token;
    if (token !== process.env.CRON_SECRET) {
      return res.status(403).send('Forbidden');
    }
    res.status(200).send('OK');
  });

  const cronRouter = require('./routes/cronRouter');
  app.use('/cron', cronRouter);

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  // app.listen(process.env.PORT, () => {
  //   console.log(`Running on port ${process.env.PORT}`);
  // });

  module.exports = (req, res) => app(req, res);
  
})();



