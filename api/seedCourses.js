const mongoose = require('mongoose');
const Course = require('./models/courseSchema'); 
const dotenv = require('dotenv');
dotenv.config({ quiet: true });
// Sample courses
const courses = [
  {
    name: "Python Full Stack Development",
    description: "Master Python, Django, REST APIs, and frontend integration.",
    tags: ["python", "django", "full stack"],
    location: { type: "Point", coordinates: [77.433278, 23.237203] }
  },
  {
    name: "Java Full Stack Development",
    description: "Learn Java, Spring Boot, MySQL, and React.",
    tags: ["java", "spring boot", "full stack"],
    location: { type: "Point", coordinates: [77.433278, 23.237203] }
  },
  {
    name: "MERN Stack Development",
    description: "Build modern web apps using MongoDB, Express, React, and Node.js.",
    tags: ["mern", "mongodb", "react", "node", "express", "full stack"],
    location: { type: "Point", coordinates: [77.433278, 23.237203] }
  },
  {
    name: "Data Structures and Algorithms (DSA)",
    description: "Master problem-solving in Python, Java, and C++.",
    tags: ["dsa", "algorithms", "data structures"],
    location: { type: "Point", coordinates: [77.433278, 23.237203] }
  },
  {
    name: "Web Design and UI/UX Fundamentals",
    description: "Learn HTML, CSS, JavaScript, and responsive design.",
    tags: ["web design", "html", "css", "uiux", "frontend"],
    location: { type: "Point", coordinates: [77.433278, 23.237203] }
  }
];

// Replace this with your MongoDB Atlas URI
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true 
})
.then(async () => {
  console.log('✅ MongoDB connected');

  // Insert courses without removing existing ones
  for (const course of courses) {
    const exists = await Course.findOne({ name: course.name });
    if (!exists) {
      await Course.create(course);
      console.log(`Inserted course: ${course.name}`);
    } else {
      console.log(`Course already exists: ${course.name}`);
    }
  }

  console.log('✅ Seeding complete!');
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});



