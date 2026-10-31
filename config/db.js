import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

let db;

export async function connectToMongoDB() {
  try {
    await client.connect();

    db = client.db("togetherly");

    console.log("You successfully connected to MongoDB!");

    return client;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

export function getDB() {
  if (!db) {
    throw new Error("Database is not connected!");
  }

  return db;
}