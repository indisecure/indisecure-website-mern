const express = require('express');
const router = express.Router();
const Fee = require('../models/feeSchema');
const verifyToken = require('../utils/verifyToken');

router.get('/', verifyToken, async (req, res) => {
  const fees = await Fee.find().sort({ dueDate: 1 });
  res.json(fees);
});

router.post('/', verifyToken, async (req, res) => {
  const fee = new Fee({
    studentName: req.body.studentName,
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
  await Fee.updateOne({ _id: req.params.id }, { isPaid: req.body.isPaid });
  res.json({ success: true });
});

router.put('/:id/reminder', verifyToken, async (req, res) => {
  await Fee.updateOne({ _id: req.params.id }, { reminderEnabled: req.body.enabled });
  res.json({ success: true });
});

module.exports = router;
