const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Course = require("../models/courseSchema");

router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ success: false, error: "Database not connected" });
    }

    const { q, lat, lng, radius = 20000, limit = 20, page = 1 } = req.query;
    const pageLimit = Math.min(parseInt(limit), 50);
    const skip = (Math.max(parseInt(page), 1) - 1) * pageLimit;

    let results = [];

    const hasText = q && q.trim() !== "";
    const hasLocation = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));

    // Location only
    if (hasLocation && !hasText) {
      results = await Course.find({
        location: {
          $nearSphere: {
            $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius),
          },
        },
      }).skip(skip).limit(pageLimit);
    }

    // Text search (optionally with location, but MongoDB can't combine)
    if (hasText) {
      results = await Course.find({ $text: { $search: q.trim() } })
        .skip(skip)
        .limit(pageLimit)
        .sort({ score: { $meta: "textScore" } })
        .select({ score: { $meta: "textScore" } });

      // Manual filter: match all words in name/tags/description
      const words = q.toLowerCase().split(" ");
      results = results.filter(course =>
        words.every(word =>
          course.name.toLowerCase().includes(word) ||
          course.tags.some(tag => tag.toLowerCase().includes(word)) ||
          course.description.toLowerCase().includes(word)
        )
      );
    }

    // No filters: return all
    if (!hasText && !hasLocation) {
      results = await Course.find().skip(skip).limit(pageLimit);
    }

    res.json({ success: true, count: results.length, results });

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
