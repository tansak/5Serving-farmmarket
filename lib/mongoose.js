import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = (process.env.MONGODB_URI || "").replace(/﻿/g, "").replace(/\n/g, "").trim();
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false })
      .then((m) => {
        console.log("MongoDB connected");
        return m;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
