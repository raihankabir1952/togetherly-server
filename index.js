import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import { connectToMongoDB, getDB } from "./config/db.js";
import { ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
const PORT = process.env.PORT || 5000;

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.BETTER_AUTH_URL}/api/auth/jwks`)
);

// JWT Middleware
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization Header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in to access this resource.",
      });
    }

    // Extract Token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing. Please log in again.",
      });
    }

    // Verify JWT
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: "http://localhost:3000",
      audience: "http://localhost:3000",
    });

    // Store Verified User Information
    req.user = payload;

    console.log("Token verified successfully!");

    next();
  } catch (error) {
    console.error("Token validation failed:", error.message);

    return res.status(401).json({
      success: false,
      message: "Your session is invalid or expired. Please log in again.",
    });
  }
};

// Home route
app.get("/", (req, res) => {
  res.send("Togetherly Server is Running!");
});


// Create Event
app.post("/events", verifyToken, async (req, res) => {
  try {
    const {
      title,
      description,
      eventType,
      thumbnail,
      location,
      eventDate,
    } = req.body;

    // Get verified user email from JWT
    const creatorEmail = req.user.email;

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


// Get events created by a specific user
app.get("/my-events", verifyToken, async (req, res) => {
  try {
    // Get authenticated user's email from JWT
    const email = req.user.email;

    const db = getDB();

    const events = await db
      .collection("events")
      .find({ creatorEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Fetching user events failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch your events.",
    });
  }
});


// Update Event: PUT /events/:id
app.put("/events/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      eventType,
      thumbnail,
      location,
      eventDate,
    } = req.body;

    // Get authenticated user's email from JWT
    const creatorEmail = req.user.email;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const db = getDB();

    const result = await db.collection("events").updateOne(
      {
        _id: new ObjectId(id),
        creatorEmail,
      },
      {
        $set: {
          title,
          description,
          eventType,
          thumbnail,
          location,
          eventDate: new Date(eventDate),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found or you are not authorized.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event updated successfully!",
    });
  } catch (error) {
    console.error("Event update failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update event.",
    });
  }
});


//Delete Event: DELETE /events/:id
app.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const db = getDB();

    const result = await db.collection("events").deleteOne({
      _id: new ObjectId(id),
      creatorEmail: email,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found or you are not authorized.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event deleted successfully!",
    });
  } catch (error) {
    console.error("Event deletion failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete event.",
    });
  }
});


app.get("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const db = getDB();

    // Find event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    // Find organizer from Better Auth user collection
    const organizer = await db.collection("user").findOne(
      { email: event.creatorEmail },
      {
        projection: {
          _id: 1,
          name: 1,
          email: 1,
          image: 1,
        },
      }
    );

    res.status(200).json({
      success: true,
      event,
      organizer: organizer
        ? {
          id: organizer._id,
          name: organizer.name,
          email: organizer.email,
          image: organizer.image,
        }
        : null,
    });
  } catch (error) {
    console.error("Fetching event details failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch event details.",
    });
  }
});




app.post("/events/:id/join", async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    // Validate event ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    // Validate user email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "User email is required.",
      });
    }

    const db = getDB();

    // Find event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    // Prevent organizer from joining own event
    if (event.creatorEmail === email) {
      return res.status(403).json({
        success: false,
        message: "You cannot join your own event.",
      });
    }

    // Prevent joining past events
    if (new Date(event.eventDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "This event has already started.",
      });
    }

    const participantsCollection = db.collection("eventParticipants");

    // Prevent duplicate joins at database level
    await participantsCollection.createIndex(
      { eventId: 1, userEmail: 1 },
      { unique: true }
    );

    const participant = {
      eventId: new ObjectId(id),
      userEmail: email,
      joinedAt: new Date(),
    };

    await participantsCollection.insertOne(participant);

    res.status(201).json({
      success: true,
      message: "You have successfully joined this event!",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already joined this event.",
      });
    }

    console.error("Joining event failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to join event.",
    });
  }
});

app.get("/events/:id/join-status", async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "User email is required.",
      });
    }

    const db = getDB();

    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const participant = await db
      .collection("eventParticipants")
      .findOne({
        eventId: new ObjectId(id),
        userEmail: email,
      });

    res.status(200).json({
      success: true,
      isJoined: !!participant,
      isOwnEvent: event.creatorEmail === email,
    });
  } catch (error) {
    console.error("Checking join status failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to check join status.",
    });
  }
});

app.delete("/events/:id/leave", async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "User email is required.",
      });
    }

    const db = getDB();

    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (event.creatorEmail === email) {
      return res.status(403).json({
        success: false,
        message: "You cannot leave your own event.",
      });
    }

    const result = await db
      .collection("eventParticipants")
      .deleteOne({
        eventId: new ObjectId(id),
        userEmail: email,
      });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "You have not joined this event.",
      });
    }

    res.status(200).json({
      success: true,
      message: "You have successfully left this event.",
    });
  } catch (error) {
    console.error("Leaving event failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to leave event.",
    });
  }
});


app.get("/joined-events", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "User email is required.",
      });
    }

    const db = getDB();

    const joinedEvents = await db
      .collection("eventParticipants")
      .aggregate([
        {
          $match: {
            userEmail: email,
          },
        },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        {
          $unwind: "$event",
        },
        {
          $project: {
            _id: "$event._id",
            title: "$event.title",
            description: "$event.description",
            eventType: "$event.eventType",
            thumbnail: "$event.thumbnail",
            location: "$event.location",
            eventDate: "$event.eventDate",
            creatorEmail: "$event.creatorEmail",
            joinedAt: 1,
          },
        },
        {
          $sort: {
            eventDate: 1,
          },
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      total: joinedEvents.length,
      events: joinedEvents,
    });
  } catch (error) {
    console.error("Fetching joined events failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch joined events.",
    });
  }
});

// Get Event Participants: GET /events/:id/participants
app.get("/events/:id/participants", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const participants = await getDB()
      .collection("eventParticipants")
      .aggregate([
        {
          $match: {
            eventId: new ObjectId(id),
          },
        },
        {
          $lookup: {
            from: "user",
            localField: "userEmail",
            foreignField: "email",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            _id: 0,
            name: "$user.name",
            image: "$user.image",
          },
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      totalParticipants: participants.length,
      participants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch participants",
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
