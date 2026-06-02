import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Settings } from "@/lib/models/settings";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    let settings = await Settings.findOne();
    if (!settings) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session) {
        settings = await Settings.create({
          email: "subhajitchoudhuryofficial@gmail.com",
          handle: "@filteredout.dev",
          githubUrl: "https://github.com/Subhajit-FD",
          linkedinUrl: "",
          instagramUrl: "",
          twitterUrl: "",
          behanceUrl: "",
        });
      } else {
        // Return default values in-memory, but DO NOT save to database!
        return NextResponse.json({
          email: "subhajitchoudhuryofficial@gmail.com",
          handle: "@filteredout.dev",
          githubUrl: "https://github.com/Subhajit-FD",
          linkedinUrl: "",
          instagramUrl: "",
          twitterUrl: "",
          behanceUrl: "",
        });
      }
    }
    return NextResponse.json(settings);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to fetch settings:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, handle, githubUrl, linkedinUrl, instagramUrl, twitterUrl, behanceUrl } = body;

    await dbConnect();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (email !== undefined) settings.email = email;
    if (handle !== undefined) settings.handle = handle;
    if (githubUrl !== undefined) settings.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) settings.linkedinUrl = linkedinUrl;
    if (instagramUrl !== undefined) settings.instagramUrl = instagramUrl;
    if (twitterUrl !== undefined) settings.twitterUrl = twitterUrl;
    if (behanceUrl !== undefined) settings.behanceUrl = behanceUrl;
    settings.updatedAt = new Date();

    await settings.save();
    return NextResponse.json(settings);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to update settings:", err);
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status: 500 });
  }
}
