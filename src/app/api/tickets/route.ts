import { NextRequest, NextResponse } from "next/server";
import { getTickets, createTicket, addDuplicateMatch } from "@/lib/db";
import { Status, Category, Severity } from "@/lib/types";
import { getEquallyAssignedStaff } from "@/lib/equalStaffAssignment";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as Status | undefined;
    const category = searchParams.get("category") as Category | undefined;
    const severity = searchParams.get("severity") as Severity | undefined;
    const search = searchParams.get("search") || undefined;

    const tickets = getTickets({ status, category, severity, search, sortByPriority: searchParams.get("sort") === "priority" });
    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    console.error("Error in GET /api/tickets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      complaintText,
      summary,
      category,
      department,
      location,
      severity,
      severityReason,
      photo,
      video,
      submittedBy,
      extractedDetails,
      aiReasoning,
      aiProvider,
      followUpResponses,
      duplicateMatches,
      assignedTo,
      status,
      autoAssign,
    } = body;

    if (!complaintText || !category || !location) {
      return NextResponse.json(
        { success: false, error: "Missing required ticket fields." },
        { status: 400 }
      );
    }

    // Generate unique human-readable ticket ID, e.g., CC-2026-4892
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `CC-2026-${randomSuffix}`;

    // Equal Staff Assignment: If multiple students raise tickets of the same issue type,
    // distribute the task to staff equally based on current active load and round-robin equity.
    let assignedStaff = assignedTo || "";
    let equalDispatchMeta: any = null;

    if (autoAssign !== false && (!assignedStaff || assignedStaff.trim() === "")) {
      const equalAssignment = getEquallyAssignedStaff(category as Category);
      assignedStaff = equalAssignment.assignedTo;
      equalDispatchMeta = {
        staffName: equalAssignment.staffName,
        assignedTo: equalAssignment.assignedTo,
        activeTasksBeforeAssignment: equalAssignment.activeTasksBeforeAssignment,
        teamAverageActiveTasks: equalAssignment.teamAverageActiveTasks,
        reason: equalAssignment.reason,
      };
    }

    const initialStatus: Status = status || (assignedStaff ? "ASSIGNED" : "NEW");

    const newTicket = createTicket({
      ticketId,
      complaintText,
      summary: summary || complaintText.substring(0, 60),
      category,
      department: department || (equalDispatchMeta ? equalDispatchMeta.department : "Campus Facilities Operations"),
      location,
      severity: severity || "MEDIUM",
      severityReason: severityReason || undefined,
      photo: photo || undefined,
      video: video || undefined,
      status: initialStatus,
      submittedBy: submittedBy || "Student (Anonymous)",
      assignedTo: assignedStaff,
      extractedDetails: extractedDetails || [],
      aiReasoning: aiReasoning || (equalDispatchMeta ? equalDispatchMeta.reason : ""),
      aiProvider: aiProvider || "fallback",
      followUpResponses: followUpResponses || {},
    });

    // Save duplicate matches if provided
    if (Array.isArray(duplicateMatches) && duplicateMatches.length > 0) {
      for (const match of duplicateMatches) {
        if (match.matchedTicketId) {
          addDuplicateMatch(
            ticketId,
            match.matchedTicketId,
            match.reason || "Possible duplicate detected by Gemini Operations Agent.",
            match.similarityScore || 0.8
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      ticket: newTicket,
      equalDispatch: equalDispatchMeta,
    });
  } catch (error: any) {
    console.error("Error in POST /api/tickets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create ticket." },
      { status: 500 }
    );
  }
}
