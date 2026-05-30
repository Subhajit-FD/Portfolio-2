import mongoose from "mongoose";

type ConnectionObject = {
  isConnected?: number;
};

// Global cache to prevent multiple connections in serverless environments (like Next.js)
const globalMongoose = globalThis as unknown as { mongooseConnection: ConnectionObject };
const connection: ConnectionObject = globalMongoose.mongooseConnection || {};

if (!globalMongoose.mongooseConnection) {
  globalMongoose.mongooseConnection = connection;
}

// 1. Keeps returning Promise<void>, focusing purely on establishing the connection state
async function dbConnect(): Promise<void> {
  if (connection.isConnected) {
    console.log("Already connected to DB");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI as string);

    connection.isConnected = db.connections[0].readyState;

    console.log("DB Connected");
  } catch (error) {
    console.log("Database Connection Failed", error);
    // Note: Be careful with process.exit(1) in serverless environments, 
    // as it will kill the entire container instance.
    process.exit(1); 
  }
}

export default dbConnect;


export async function getRawDb() {
  await dbConnect(); 
  
  if (!mongoose.connection.db) {
    throw new Error("Database connection is established, but raw DB instance is unavailable.");
  }
  
  return mongoose.connection.db;
}