import { Schema, model, models } from "mongoose";

export interface ISettings {
  email: string;
  handle: string;
  githubUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  behanceUrl?: string;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  email: { type: String, required: true, default: "subhajitchoudhuryofficial@gmail.com" },
  handle: { type: String, required: true, default: "@filteredout.dev" },
  githubUrl: { type: String, default: "" },
  linkedinUrl: { type: String, default: "" },
  instagramUrl: { type: String, default: "" },
  twitterUrl: { type: String, default: "" },
  behanceUrl: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

export const Settings = models.Settings || model<ISettings>("Settings", SettingsSchema);
