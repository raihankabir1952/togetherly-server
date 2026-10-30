
import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

connectToMongoDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Togetherly Server is Running!");
});

app.listen(PORT, () => {
  console.log(`Togetherly server running on port ${PORT}`);
});
