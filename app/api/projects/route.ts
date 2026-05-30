import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Project } from "@/lib/models/project";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const projects = await Project.find().sort({ createdAt: -1 });
    return NextResponse.json(projects);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to fetch projects:", err);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authorize session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body
    const body = await request.json();
    const { title, liveUrl, githubUrl, mobileImage, desktopImage } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await dbConnect();
    const newProject = await Project.create({
      title,
      liveUrl,
      githubUrl,
      mobileImage,
      desktopImage,
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to create project:", err);
    return NextResponse.json({ error: err.message || "Failed to create project" }, { status: 500 });
  }
}
