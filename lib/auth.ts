import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { getRawDb } from "./dbConnect";


const dbInstance = await getRawDb();

export const auth = betterAuth({
  
  database: mongodbAdapter(dbInstance),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: false
  },
  advanced: {
    trustedProxyHeaders: true
  }
});