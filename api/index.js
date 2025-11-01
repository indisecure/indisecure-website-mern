const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ quiet: true });
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");

const User = require("./models/userSchema");
const Fee = require("./models/feeSchema");
const Course = require("./models/courseSchema");
const verifyTokenServerless = require("./utils/verifyTokenServerless");
const runReminderJob = require("./reminderService");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const conn = await mongoose.connect(process.env.MONGO_URI);
  cachedDb = conn;
  console.log(`✅ [DB] Connected to ${conn.connection.host}`);
  return conn;
}

app.all("*", async (req, res) => {
  try {
    const url = req.url;

    // USER ROUTES
    if (url.startsWith("/register") && req.method === "POST") {
      const { email, password } = req.body;
      const passwordHash = await bcrypt.hash(password, 2);
      try {
        const user = new User({ email, passwordHash });
        await user.save();
        return res.json({ message: "User registered" });
      } catch {
        return res.status(400).json({ message: "User already exists or error occurred" });
      }
    }

    if (url.startsWith("/login") && req.method === "POST") {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ message: "Unauthorized" });

      const token = jwt.sign(
        { id: user._id, email: user.email, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      return res.json({ token });
    }

    // FEE ROUTES
    if (url.startsWith("/fees")) {
      const token = req.headers.authorization?.split(" ")[1];
      const user = await verifyTokenServerless(token);
      if (!user || !user.isAdmin) return res.status(403).json({ error: "Access denied" });

      if (req.method === "GET") {
        if (url.endsWith("/reminder-preview")) {
          const today = moment().tz("Asia/Kolkata").startOf("day").toDate();
          const daysAgo = moment().tz("Asia/Kolkata").subtract(2, "days").startOf("day").toDate();
          const dueFees = await Fee.find({
            dueDate: { $lte: today },
            isPaid: false,
            reminderEnabled: true,
            $or: [{ lastReminderSent: { $lte: daysAgo } }, { lastReminderSent: null }],
          });
          return res.json(dueFees);
        }

        if (url.endsWith("/trigger-reminder")) {
          const result = await runReminderJob();
          return res.json({ success: true, remindersSent: result.count });
        }

        const fees = await Fee.find().sort({ dueDate: 1 });
        return res.json(fees);
      }

      if (req.method === "POST") {
        const fee = new Fee(req.body);
        await fee.save();
        return res.json({ success: true });
      }

      if (req.method === "PUT") {
        const idMatch = url.match(/\/fees\/([a-f0-9]{24})/);
        if (!idMatch) return res.status(400).json({ error: "Fee ID missing" });
        const id = idMatch[1];

        if (url.includes("/status")) {
          await Fee.updateOne({ _id: id }, { isPaid: req.body.isPaid });
        } else if (url.includes("/reminder")) {
          await Fee.updateOne({ _id: id }, { reminderEnabled: req.body.enabled });
        } else if (url.includes("/paid-amount")) {
          const fee = await Fee.findById(id);
          const isPaid = req.body.paidAmount >= fee.feeAmount;
          await Fee.updateOne({ _id: id }, { paidAmount: req.body.paidAmount, isPaid });
        }

        return res.json({ success: true });
      }
    }

    // CRON
    if (url.startsWith("/cron/ping") && req.method === "GET") {
      const token = req.query.token;
      if (token !== process.env.CRON_SECRET) return res.status(403).json({ error: "Unauthorized" });
      const result = await runReminderJob();
      return res.json({ success: true, remindersSent: result.count });
    }

    // SEARCH
    if (url.startsWith("/search") && req.method === "GET") {
      const { q, lat, lng, radius = 20000, limit = 20, page = 1 } = req.query;
      const pageLimit = Math.min(parseInt(limit), 50);
      const skip = (Math.max(parseInt(page), 1) - 1) * pageLimit;
      let results = [];

      const hasText = q && q.trim() !== "";
      const hasLocation = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));

      if (hasLocation && !hasText) {
        results = await Course.find({
          location: {
            $nearSphere: {
              $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
              $maxDistance: parseInt(radius),
            },
          },
        }).skip(skip).limit(pageLimit);
      } else if (hasText) {
        results = await Course.find({ $text: { $search: q.trim() } })
          .skip(skip)
          .limit(pageLimit)
          .sort({ score: { $meta: "textScore" } })
          .select({ score: { $meta: "textScore" } });

        const words = q.toLowerCase().split(" ");
        results = results.filter((course) =>
          words.every(
            (word) =>
              course.name.toLowerCase().includes(word) ||
              course.tags.some((tag) => tag.toLowerCase().includes(word)) ||
              course.description.toLowerCase().includes(word)
          )
        );
      } else {
        results = await Course.find().skip(skip).limit(pageLimit);
      }

      const acceptsHtml = req.headers.accept && req.headers.accept.includes("text/html");

      if (acceptsHtml) {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Search Results for "${q || 'All Courses'}"</title>
              <meta name="description" content="Courses related to ${q || 'various topics'}">
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                .course { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
                .course h2 { margin: 0; font-size: 1.2em; }
                .course p { margin: 5px 0; }
              </style>
            </head>
            <body>
              <h1>Search Results for "${q || 'All Courses'}"</h1>
              <p>Found ${results.length} course${results.length !== 1 ? 's' : ''}.</p>
              ${results.map(course => `
                <div class="course">
                  <h2>${course.name}</h2>
                  <p>${course.description}</p>
                  <p><strong>Tags:</strong> ${course.tags.join(', ')}</p>
                </div>
              `).join('')}
            </body>
          </html>
        `;
        return res.send(html);
      }

      return res.json({ success: true, count: results.length, results });
    }

    // WARM
    if (url.startsWith("/warm") && req.method === "GET") {
      const token = req.query.token;
      if (token !== process.env.CRON_SECRET) return res.status(403).send("Forbidden");
      return res.status(200).send("OK");
    }

    // ✅ Serve React frontend with 404 status for unknown GET routes
    if (req.method === "GET") {
  const urlPath = req.url.split("?")[0].toLowerCase().replace(/\/$/, "");

  const staticRoutes = [
    "/", "/about", "/course", "/alumni", "/contact","/register","/login","/search"
  ];

  const isStatic = staticRoutes.includes(urlPath);

  const isCourseAlias = /^\/(c-c-plus-plus|java|python|javascript|web-design|react|dsa|docker|java-full-stack|python-full-stack|mern-stack|oracle|mongodb|sql|data-analytics)-(course|training|classes|coaching)-in-(bhopal|mp-nagar-bhopal|mpnagar|mp-nagar)$/.test(urlPath);

  if (isStatic || isCourseAlias) {
    // ✅ Valid route → return 200 OK
    return res.sendFile(path.join(__dirname, "dist", "index.html"));
  }

  // ❌ Unknown route → return 404
  res.status(404);
  return res.sendFile(path.join(__dirname, "dist", "index.html"));
}


    // ✅ Return 404 for other unmatched methods
    return res.status(404).json({ error: "Not found" });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// Local server
// (async () => {
//   try {
//     await connectToDatabase();
//     const port = process.env.PORT || 5000;
//     app.listen(port, () => console.log(`Server running on port ${port}`));
//   } catch (err) {
//     console.error("DB connection failed:", err.message);
//   }
// })();

// Export for Vercel
module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (err) {
    console.error("Database connection failed:", err.message);
    res.status(500).send("Database connection failed.");
  }
};
