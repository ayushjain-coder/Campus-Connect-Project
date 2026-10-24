import { NextResponse } from "next/server";
import { resetToSeedData, getTickets, getStats } from "@/lib/db";

export async function POST() {
  try {
    resetToSeedData();
    const tickets = getTickets();
    const stats = getStats();
    return NextResponse.json({
      success: true,
      message: "Database successfully reset with demo seed tickets.",
      tickets,
      stats,
    });
  } catch (error: any) {
    console.error("Error in POST /api/seed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset seed data." },
      { status: 500 }
    );
  }
}
