import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import { connectToMongoDB, getDB } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("Togetherly Server is Running!");
});

// Create Event
app.post("/events", async (req, res) => {
  try {
    const {
      title,
      description,
      eventType,
      thumbnail,
      location,
      eventDate,
      creatorEmail,
    } = req.body;

    const newEvent = {
      title,
      description,
      eventType,
      thumbnail,
      location,
      eventDate: new Date(eventDate),
      creatorEmail,
      createdAt: new Date(),
    };

    const db = getDB();

    const result = await db.collection("events").insertOne(newEvent);

    res.status(201).json({
      success: true,
      message: "Event created successfully!",
      eventId: result.insertedId,
    });
  } catch (error) {
    console.error("Event creation failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create event.",
    });
  }
});

// Get Upcoming Events
app.get("/events", async (req, res) => {
  try {
    const db = getDB();

    const limit = Number.parseInt(req.query.limit, 10);

    const query = {
      eventDate: {
        $gte: new Date(),
      },
    };

    let eventsQuery = db
      .collection("events")
      .find(query)
      .sort({ eventDate: 1 });

    // Apply limit only when a valid limit is provided
    if (Number.isInteger(limit) && limit > 0) {
      eventsQuery = eventsQuery.limit(limit);
    }

    const events = await eventsQuery.toArray();

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Fetching events failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch events.",
    });
  }
});

// Start server
async function startServer() {
  await connectToMongoDB();

  app.listen(PORT, () => {
    console.log(`Togetherly server running on port ${PORT}`);
  });
}

startServer();
