import { NextRequest, NextResponse } from "next/server";
import { analyzeComplaintWithGemini } from "@/lib/gemini";
import { getTickets } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { complaintText, location, photo, video, followUpResponses } = body;

    if (!complaintText || typeof complaintText !== "string" || !complaintText.trim()) {
      return NextResponse.json(
        { success: false, error: "Complaint text is required." },
        { status: 400 }
      );
    }

    // Fetch existing active tickets for duplicate evaluation
    const existingTickets = getTickets();

    const analysis = await analyzeComplaintWithGemini({
      complaintText,
      location: location || "",
      photo,
      video,
      existingTickets,
      followUpResponses,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error("Error in /api/analyze-complaint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to analyze complaint.",
      },
      { status: 500 }
    );
  }
}
