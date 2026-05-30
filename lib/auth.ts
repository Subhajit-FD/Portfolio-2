import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getRawDb } from "./dbConnect";

// Resolve the DB instance immediately
const dbInstance = await getRawDb();

export const auth = betterAuth({
  // Pass the resolved Db object directly
  database: mongodbAdapter(dbInstance),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: false
  },
});