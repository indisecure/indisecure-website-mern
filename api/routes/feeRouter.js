const express = require('express');
const router = express.Router();
const Fee = require('../models/feeSchema');
const verifyToken = require('../utils/verifyToken');

router.get('/', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Access denied' });
  const fees = await Fee.find().sort({ dueDate: 1 });
  res.json(fees);
});

router.get('/reminder-preview', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Access denied' });

  const today = new Date();
  const threeDaysAgo = new Date(today - 3 * 24 * 60 * 60 * 1000);

  const dueFees = await Fee.find({
    dueDate: { $lte: today },
    isPaid: false,
    reminderEnabled: true,
    $or: [
      { lastReminderSent: { $lt: threeDaysAgo } },
      { lastReminderSent: null }
    ]
  });

  res.json(dueFees);
});


router.post('/', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Access denied' });

  const fee = new Fee({
    studentName: req.body.studentName,
    studentEmail: req.body.studentEmail,
    courseName: req.body.courseName,
    feeAmount: req.body.feeAmount,
    dueDate: req.body.dueDate,
    isPaid: req.body.isPaid || false,
    reminderEnabled: req.body.reminderEnabled || true
  });

  await fee.save();
  res.json({ success: true });
});


router.put('/:id/status', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Access denied' });

  await Fee.updateOne({ _id: req.params.id }, { isPaid: req.body.isPaid });
  res.json({ success: true });
});


router.put('/:id/reminder', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Access denied' });

  await Fee.updateOne({ _id: req.params.id }, { reminderEnabled: req.body.enabled });
  res.json({ success: true });
});

router.put('/:id/paid-amount', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Access denied' });

  const { paidAmount } = req.body;
  const fee = await Fee.findById(req.params.id);
  const isPaid = paidAmount >= fee.feeAmount;

  await Fee.updateOne({ _id: req.params.id }, { paidAmount, isPaid });
  res.json({ success: true });
});



module.exports = router;
