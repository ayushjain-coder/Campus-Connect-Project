import { NextRequest, NextResponse } from "next/server";
import { 
  getTicketById, 
  updateTicket, 
  getTicketUpdates, 
  getDuplicateMatches 
} from "@/lib/db";
import { requireAuth } from "@/lib/authMiddleware";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    const ticket = getTicketById(ticketId);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: `Ticket ${ticketId} not found.` },
        { status: 404 }
      );
    }

    const updates = getTicketUpdates(ticketId);
    const duplicateMatches = getDuplicateMatches(ticketId);

    return NextResponse.json({
      success: true,
      ticket,
      updates,
      duplicateMatches,
    });
  } catch (error: any) {
    console.error("Error in GET /api/tickets/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ticket." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Ticket updates are staff-only actions
  const auth = requireAuth(req, "STAFF");
  if (!auth.ok) return auth.response;

  try {
    const ticketId = params.id;
    const body = await req.json();
    const { status, assignedTo, resolutionNotes, note, updatedBy } = body;

    const updated = updateTicket(ticketId, {
      status,
      assignedTo,
      resolutionNotes,
      note,
      updatedBy: updatedBy || "Campus Operations Staff",
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Ticket ${ticketId} not found.` },
        { status: 404 }
      );
    }

    const updates = getTicketUpdates(ticketId);
    const duplicateMatches = getDuplicateMatches(ticketId);

    return NextResponse.json({
      success: true,
      ticket: updated,
      updates,
      duplicateMatches,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/tickets/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update ticket." },
      { status: 500 }
    );
  }
}
