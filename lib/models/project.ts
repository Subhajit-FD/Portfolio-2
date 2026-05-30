import { Schema, model, models } from "mongoose";

export interface IProject {
  title: string;
  liveUrl?: string;
  githubUrl?: string;
  mobileImage?: string;
  desktopImage?: string;
  featured: boolean;
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true },
  liveUrl: { type: String },
  githubUrl: { type: String },
  mobileImage: { type: String },
  desktopImage: { type: String },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Project = models.Project || model<IProject>("Project", ProjectSchema);
