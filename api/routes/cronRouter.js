const express = require('express');
const router = express.Router();
const runReminderJob = require('../reminderService'); 

router.get('/ping', async (req, res) => {
  const token = req.query.token;
  if (token !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const result = await runReminderJob();
    res.json({ success: true, remindersSent: result.count });
  } catch (err) {
    res.status(500).json({ error: 'Reminder job failed', details: err.message });
  }
});

module.exports = router;
