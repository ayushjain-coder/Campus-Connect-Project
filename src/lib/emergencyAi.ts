import { GoogleGenAI } from "@google/genai";
import { EmergencyIncident } from "./emergencyTypes";
import { getEmergencyById, saveEmergency } from "./emergencyDb";
import { broadcastEmergencyEvent } from "./emergencyEvents";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Runs parallel background assessment of an emergency incident without blocking immediate routing.
 */
export async function runEmergencyAiAssessment(incidentId: string): Promise<void> {
  const incident = getEmergencyById(incidentId);
  if (!incident) return;

  try {
    // If Gemini client available, prompt Gemini 2.5 Flash for rapid safety assessment
    if (ai) {
      const prompt = `You are a Campus Safety AI Agent. Rapidly assess this campus emergency incident:
Emergency Type: ${incident.type}
Location: ${incident.location.building}, Floor ${incident.location.floor}, Room ${incident.location.room}
Description: ${incident.description}
People Affected: ${incident.peopleAffected || 1}

Provide a JSON response with:
{
  "aiSeverity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "aiReasoning": "1 concise sentence explaining the immediate risk",
  "aiRecommendations": ["2-3 short safety precautions for responders and students"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const text = response.text || "";
      const parsed = JSON.parse(text);

      incident.aiSeverity = parsed.aiSeverity || "CRITICAL";
      incident.aiReasoning = parsed.aiReasoning || "Immediate safety hazard requiring prompt responder intervention.";
      incident.aiRecommendations = parsed.aiRecommendations || [
        "Maintain a safe perimeter away from the incident.",
        "Ensure ventilation and clear egress routes.",
      ];
    } else {
      // Heuristic fallback for zero latency
      fallbackAssessment(incident);
    }
  } catch (err) {
    console.warn("Gemini emergency AI assessment error, using fallback:", err);
    fallbackAssessment(incident);
  }

  // Save updated incident
  saveEmergency(incident);

  // Broadcast update to real-time streams
  broadcastEmergencyEvent({
    type: "incident:updated",
    payload: { incident },
    timestamp: new Date().toISOString(),
  });
}

function fallbackAssessment(incident: EmergencyIncident): void {
  const desc = incident.description.toLowerCase();
  const people = incident.peopleAffected || 1;

  if (
    incident.type === "Fire / Smoke" ||
    incident.type === "Gas Leak" ||
    desc.includes("smoke") ||
    desc.includes("spark") ||
    desc.includes("fire") ||
    people > 5
  ) {
    incident.aiSeverity = "CRITICAL";
    incident.aiReasoning = `High-risk situation: ${incident.type.toLowerCase()} reported with ${people} people potentially affected.`;
    incident.aiRecommendations = [
      "Evacuate immediate area and keep at least 50ft perimeter.",
      "Do not touch electrical equipment or switches.",
      "Clear hallway egress paths for emergency responder.",
    ];
  } else if (incident.type === "Medical" || incident.type === "Electrical Hazard") {
    incident.aiSeverity = "HIGH";
    incident.aiReasoning = `Urgent responder attention needed for ${incident.type.toLowerCase()}.`;
    incident.aiRecommendations = [
      "Keep area accessible for designated staff.",
      "Keep student on the line via emergency chat.",
    ];
  } else {
    incident.aiSeverity = "MEDIUM";
    incident.aiReasoning = `Operational emergency reported at ${incident.location.building}.`;
    incident.aiRecommendations = [
      "Designated emergency staff assigned.",
    ];
  }
}
