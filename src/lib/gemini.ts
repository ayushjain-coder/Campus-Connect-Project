import { GoogleGenAI } from "@google/genai";
import { Category, Severity, AIAnalysisResult, Ticket } from "./types";

const CATEGORY_DEPARTMENT_MAP: Record<Category, string> = {
  Plumbing: "Facilities & Hydraulic Maintenance",
  Electricity: "Campus Electrical & Power Operations",
  Cleanliness: "Campus Hygiene & Sanitation Services",
  "Internet Connectivity": "IT & Network Infrastructure",
};

export interface AnalyzeComplaintInput {
  complaintText: string;
  location: string;
  photo?: string; // base64 or data URL
  video?: string; // base64 or data/video URL
  existingTickets: Ticket[];
  followUpResponses?: Record<string, string>;
}

/**
 * Extracts base64 and mimeType from data URL, remote image URL, or raw base64 string
 */
async function resolvePhotoPart(photoString: string): Promise<{ data: string; mimeType: string } | null> {
  if (!photoString || !photoString.trim()) return null;
  try {
    if (photoString.startsWith("data:")) {
      const parts = photoString.split(",");
      const meta = parts[0];
      const data = parts[1];
      const mimeMatch = meta.match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      return { data, mimeType };
    }
    // Remote HTTP/HTTPS URL
    if (photoString.startsWith("http://") || photoString.startsWith("https://")) {
      const res = await fetch(photoString);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = res.headers.get("content-type") || "image/jpeg";
      return { data: buffer.toString("base64"), mimeType };
    }
    // Raw base64 string
    return { data: photoString, mimeType: "image/jpeg" };
  } catch (err) {
    console.warn("Could not resolve photo data for Gemini:", err);
    return null;
  }
}

/**
 * Intelligent local simulation engine for demos and offline/fallback execution
 */
function runLocalSimulation(input: AnalyzeComplaintInput): AIAnalysisResult {
  const { complaintText, location, followUpResponses, existingTickets } = input;
  const combined = `${complaintText} ${location} ${Object.values(followUpResponses || {}).join(" ")}`.toLowerCase();

  // 1. Categorization (Strictly 1 of 4 categories)
  let category: Category = "Cleanliness";
  if (
    combined.includes("water") ||
    combined.includes("leak") ||
    combined.includes("pipe") ||
    combined.includes("tap") ||
    combined.includes("flush") ||
    combined.includes("drain") ||
    combined.includes("sink") ||
    combined.includes("toilet") ||
    combined.includes("washroom") ||
    combined.includes("puddle") ||
    combined.includes("plumb")
  ) {
    category = "Plumbing";
  } else if (
    combined.includes("electric") ||
    combined.includes("wire") ||
    combined.includes("spark") ||
    combined.includes("shock") ||
    combined.includes("light") ||
    combined.includes("bulb") ||
    combined.includes("socket") ||
    combined.includes("switch") ||
    combined.includes("breaker") ||
    combined.includes("power") ||
    combined.includes("short circuit")
  ) {
    category = "Electricity";
  } else if (
    combined.includes("wifi") ||
    combined.includes("wi-fi") ||
    combined.includes("internet") ||
    combined.includes("network") ||
    combined.includes("router") ||
    combined.includes("lan") ||
    combined.includes("ethernet") ||
    combined.includes("ssid") ||
    combined.includes("connect") ||
    combined.includes("portal")
  ) {
    category = "Internet Connectivity";
  } else {
    category = "Cleanliness";
  }

  const suggestedDepartment = CATEGORY_DEPARTMENT_MAP[category];

  // 2. Severity determination
  let severity: Severity = "MEDIUM";
  if (
    combined.includes("spark") ||
    combined.includes("smoke") ||
    combined.includes("burning") ||
    combined.includes("fire") ||
    combined.includes("shock") ||
    combined.includes("blackout") ||
    combined.includes("severe flood") ||
    combined.includes("burst")
  ) {
    severity = "CRITICAL";
  } else if (
    combined.includes("heavily") ||
    combined.includes("flooding") ||
    combined.includes("spill") ||
    combined.includes("stinking") ||
    combined.includes("urgent") ||
    combined.includes("outage") ||
    combined.includes("no connection")
  ) {
    severity = "HIGH";
  } else if (
    combined.includes("slow") ||
    combined.includes("minor") ||
    combined.includes("aesthetic") ||
    combined.includes("intermittent")
  ) {
    severity = "LOW";
  }

  // 3. Missing Information Detection
  // Check if critical details (exact floor/room/specific fixture/extent) are missing
  const hasSpecificRoomOrFloor =
    /\b(room|hall|lab|floor|block|restroom|washroom|cabin|fl\b|\d{1,3}[a-z]?)\b/i.test(location) ||
    /\b(room|hall|lab|floor|block|restroom|washroom|cabin|fl\b|\d{1,3}[a-z]?)\b/i.test(complaintText);

  const isShortText = complaintText.trim().split(/\s+/).length < 7;
  const hasResponses = followUpResponses && Object.keys(followUpResponses).length > 0;

  let isMissingInfo = false;
  let missingInfoQuestions: string[] = [];
  let suggestedQuickAnswers: Record<string, string[]> = {};

  if (!hasResponses) {
    if (!hasSpecificRoomOrFloor || isShortText || location.trim().length < 4) {
      isMissingInfo = true;

      if (category === "Plumbing") {
        missingInfoQuestions = [
          "Which floor or restroom number is the leak located in?",
          "Is the water actively flooding onto the floor or is it a slow drip?"
        ];
        suggestedQuickAnswers = {
          "Which floor or restroom number is the leak located in?": [
            "2nd Floor Restroom",
            "1st Floor Washbasin",
            "Ground Floor Hallway",
            "Hostel Block Restroom 302"
          ],
          "Is the water actively flooding onto the floor or is it a slow drip?": [
            "Active flooding onto floor",
            "Continuous steady drip into basin",
            "Small puddle forming slowly",
            "Burst pipe spraying water"
          ]
        };
      } else if (category === "Electricity") {
        missingInfoQuestions = [
          "Is there any sparking, burning odor, or exposed wire visible?",
          "Which specific room, desk, or lab bench is affected?"
        ];
        suggestedQuickAnswers = {
          "Is there any sparking, burning odor, or exposed wire visible?": [
            "Yes, visible sparks and burning smell",
            "No sparks, just no power to the socket",
            "Light fixture is flickering loudly",
            "Switch is warm to touch"
          ],
          "Which specific room, desk, or lab bench is affected?": [
            "Room 102 near workbench 3",
            "Lecture Hall A podium",
            "Library 3rd floor study carrels",
            "Hostel Room 214"
          ]
        };
      } else if (category === "Internet Connectivity") {
        missingInfoQuestions = [
          "Which Wi-Fi network (SSID) are you trying to connect to?",
          "Is this affecting all devices or just a single laptop/phone?"
        ];
        suggestedQuickAnswers = {
          "Which Wi-Fi network (SSID) are you trying to connect to?": [
            "Campus-Secure (WPA3)",
            "Campus-Guest Portal",
            "Hostel-ResNet",
            "Eduroam"
          ],
          "Is this affecting all devices or just a single laptop/phone?": [
            "Affects all students in this room",
            "Single laptop unable to authenticate",
            "Signal drops every 2 minutes",
            "Connected but no internet access"
          ]
        };
      } else {
        missingInfoQuestions = [
          "What type of waste or cleaning issue needs attention?",
          "Is it blocking any walkway, doorway, or seating area?"
        ];
        suggestedQuickAnswers = {
          "What type of waste or cleaning issue needs attention?": [
            "Overflowing trash and food waste",
            "Spilled drink/liquid slip hazard",
            "Restroom sanitation required",
            "Broken glass on sidewalk"
          ],
          "Is it blocking any walkway, doorway, or seating area?": [
            "Yes, blocks main entrance pathway",
            "Scattered across cafeteria tables",
            "No, contained in corner",
            "Slip hazard near stairwell"
          ]
        };
      }
    }
  }

  // 4. Extracted Details
  const extractedDetails: string[] = [];
  if (category === "Plumbing") {
    extractedDetails.push("Fixture: Hydraulic line / drainage or washbasin");
    if (combined.includes("flood") || combined.includes("puddle")) {
      extractedDetails.push("Hazard: Liquid accumulation / slip hazard");
    }
    extractedDetails.push(`Location specificity: ${location || "Campus building"}`);
  } else if (category === "Electricity") {
    extractedDetails.push("Apparatus: Wall circuit / electrical distribution");
    if (severity === "CRITICAL") {
      extractedDetails.push("Safety protocol: Urgent circuit breaker isolation recommended");
    }
  } else if (category === "Internet Connectivity") {
    extractedDetails.push("Infrastructure: Campus WLAN / Access Point");
    extractedDetails.push("Coverage: Localized area signal disruption");
  } else {
    extractedDetails.push("Sanitation scope: Public campus grounds / facility hygiene");
  }

  if (followUpResponses) {
    Object.entries(followUpResponses).forEach(([q, a]) => {
      extractedDetails.push(`Clarification: ${a}`);
    });
  }

  // 5. Summary Generation
  let cleanSummary = complaintText.trim();
  if (cleanSummary.length > 70) {
    cleanSummary = cleanSummary.substring(0, 67) + "...";
  }
  if (followUpResponses && Object.values(followUpResponses).length > 0) {
    const extra = Object.values(followUpResponses)[0];
    cleanSummary = `${category} issue at ${location || "campus"}: ${extra}`;
  }

  // 6. Duplicate Detection Reasoning
  const possibleDuplicates: { matchedTicketId: string; similarityScore: number; reason: string }[] = [];
  for (const existing of existingTickets) {
    if (existing.status === "RESOLVED") continue; // only active or recent tickets

    const sameCategory = existing.category === category;
    const sameLocWord =
      location.toLowerCase().includes("library") && existing.location.toLowerCase().includes("library") ||
      location.toLowerCase().includes("science") && existing.location.toLowerCase().includes("science") ||
      location.toLowerCase().includes("cafeteria") && existing.location.toLowerCase().includes("cafeteria") ||
      location.toLowerCase().includes("engineering") && existing.location.toLowerCase().includes("engineering") ||
      (location.length > 4 && existing.location.toLowerCase().includes(location.toLowerCase()));

    const textOverlap =
      (combined.includes("leak") && existing.complaintText.toLowerCase().includes("leak")) ||
      (combined.includes("spark") && existing.complaintText.toLowerCase().includes("spark")) ||
      (combined.includes("trash") && existing.complaintText.toLowerCase().includes("trash")) ||
      (combined.includes("wifi") && existing.complaintText.toLowerCase().includes("wifi"));

    if (sameCategory && (sameLocWord || textOverlap)) {
      let score = 0.72;
      if (sameLocWord && textOverlap) score = 0.94;
      else if (sameLocWord) score = 0.85;

      possibleDuplicates.push({
        matchedTicketId: existing.ticketId,
        similarityScore: score,
        reason: `Active ticket #${existing.ticketId} already reports a ${existing.category.toLowerCase()} issue in ${existing.location} ("${existing.summary}"). Both tickets appear to reference the same incident or facility.`
      });
    }
  }

  let severityReason = "Moderate operational disruption requiring standard maintenance dispatch.";
  if (severity === "CRITICAL") {
    severityReason = "Critical severity because reported arcing/fire hazard or extensive flooding presents an imminent threat to campus safety.";
  } else if (severity === "HIGH") {
    severityReason = "High severity because active leakage or infrastructure disruption impacts academic operations and risks property damage or slip hazards.";
  } else if (severity === "MEDIUM") {
    severityReason = "Medium severity because the issue disrupts normal daily campus comfort or sanitation standards without immediate safety hazard.";
  } else if (severity === "LOW") {
    severityReason = "Low severity because the report involves minor cosmetic, aesthetic, or localized non-blocking performance issues.";
  }

  return {
    summary: cleanSummary,
    category,
    suggestedDepartment,
    location: location.trim() || "Campus Facilities",
    severity,
    severityReason,
    extractedDetails,
    isMissingInfo,
    missingInfoQuestions,
    suggestedQuickAnswers,
    aiReasoning: `Triage logic identified this as ${category} routed to ${suggestedDepartment}. Severity evaluated as ${severity} based on reported impact and environmental risk.`,
    possibleDuplicates: possibleDuplicates.length > 0 ? possibleDuplicates : undefined,
    modelUsed: "simulation-fallback",
    provider: "fallback",
  };
}

/**
 * Main AI analysis function: Calls live Gemini 3.8 Flash if API key is configured,
 * otherwise seamlessly falls back to the local simulation engine.
 */
export async function analyzeComplaintWithGemini(
  input: AnalyzeComplaintInput
): Promise<AIAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  // If no API key provided, use local simulation
  if (!apiKey) {
    console.info("CampusConnect: No GEMINI_API_KEY detected. Using intelligent simulation engine.");
    return runLocalSimulation(input);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Format active existing tickets for duplicate evaluation
    const activeTicketsSummary = input.existingTickets
      .slice(0, 10)
      .map((t) => ({
        ticketId: t.ticketId,
        category: t.category,
        location: t.location,
        summary: t.summary,
        status: t.status,
        complaintExcerpt: t.complaintText.substring(0, 120),
      }));

    const systemPrompt = `You are the CampusConnect AI Operations Agent for a university campus.
Your job is to analyze student maintenance complaints, categorize them, evaluate severity, detect missing information, and identify possible duplicate tickets.

STRICT CONSTRAINTS:
1. Category MUST BE EXACTLY ONE OF:
   - "Plumbing"
   - "Electricity"
   - "Cleanliness"
   - "Internet Connectivity"

2. Responsible Department MUST MAP AS FOLLOWS:
   - Plumbing -> "Facilities & Hydraulic Maintenance"
   - Electricity -> "Campus Electrical & Power Operations"
   - Cleanliness -> "Campus Hygiene & Sanitation Services"
   - Internet Connectivity -> "IT & Network Infrastructure"

3. Severity MUST BE ONE OF:
   - "CRITICAL": Imminent danger, fire/sparks, electrocution risk, heavy flooding, structural hazard.
   - "HIGH": Urgent operational disruption, water leak spreading, room power outage, hygiene hazard.
   - "MEDIUM": Moderate disruption, single fixture issue, overflowing bin, sluggish connection.
   - "LOW": Minor cosmetic, slow internet, non-blocking cleanliness.

4. Severity Explanation (severityReason):
   - Provide a concise operational reason (1-2 sentences) explaining why this specific severity was determined based on safety risks and facility impact.

5. Photograph Analysis:
   - If a photograph is attached, inspect it visually.
   - Use visual evidence (e.g. water accumulation depth, charred sockets, waste type, LED indicators) to calibrate severity and add concrete observations to "extractedDetails" and "severityReason".

6. Missing Information Detection:
   - If the complaint or location lacks essential operational details (such as specific room/floor, exact fixture, or severity/flood level), set "isMissingInfo": true.
   - Formulate 1 to 2 concise, targeted follow-up questions in "missingInfoQuestions".
   - Provide 3-4 suggested quick answer chips per question in "suggestedQuickAnswers".
   - If the student has already answered follow-ups or the complaint is clear and specific, set "isMissingInfo": false and empty arrays.

7. Duplicate Detection Reasoning:
   - Review the provided existing tickets.
   - If this complaint matches an existing active ticket in the same location and category, flag it in "possibleDuplicates".
   - Provide the matchedTicketId, a similarityScore (0.0 to 1.0), and a clear reason explaining the similarity.
   - If no duplicate matches, return an empty array for "possibleDuplicates".

Respond ONLY with a valid JSON object matching this schema:
{
  "summary": string,
  "category": "Plumbing" | "Electricity" | "Cleanliness" | "Internet Connectivity",
  "suggestedDepartment": string,
  "location": string,
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "severityReason": string,
  "extractedDetails": string[],
  "isMissingInfo": boolean,
  "missingInfoQuestions": string[],
  "suggestedQuickAnswers": { [question: string]: string[] },
  "aiReasoning": string,
  "possibleDuplicates": [
    {
      "matchedTicketId": string,
      "similarityScore": number,
      "reason": string
    }
  ]
}`;

    const userPrompt = `Student Complaint:
"${input.complaintText}"

Reported Location:
"${input.location}"

Student Follow-up Answers (if any):
${JSON.stringify(input.followUpResponses || {}, null, 2)}

Active Existing Tickets on Campus:
${JSON.stringify(activeTicketsSummary, null, 2)}

Please analyze this complaint and output the JSON response.`;

    const contents: any[] = [];
    contents.push({ text: userPrompt });

    // Multimodal image support
    if (input.photo) {
      const parsed = await resolvePhotoPart(input.photo);
      if (parsed) {
        contents.push({
          inlineData: {
            mimeType: parsed.mimeType,
            data: parsed.data,
          },
        });
      }
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text?.trim() || "";
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      // Clean possible markdown code fences
      const cleaned = responseText.replace(/```json\s*|\s*```/g, "");
      parsed = JSON.parse(cleaned);
    }

    // Validate category
    const validCategories: Category[] = ["Plumbing", "Electricity", "Cleanliness", "Internet Connectivity"];
    const category: Category = validCategories.includes(parsed.category) ? parsed.category : "Cleanliness";

    const parsedSeverity: Severity = parsed.severity || "MEDIUM";
    const defaultSeverityReason = `Classified as ${parsedSeverity} based on reported physical impact and operational continuity risk.`;

    return {
      summary: parsed.summary || input.complaintText.substring(0, 60),
      category,
      suggestedDepartment: CATEGORY_DEPARTMENT_MAP[category],
      location: parsed.location || input.location,
      severity: parsedSeverity,
      severityReason: parsed.severityReason || defaultSeverityReason,
      extractedDetails: Array.isArray(parsed.extractedDetails) ? parsed.extractedDetails : [],
      isMissingInfo: Boolean(parsed.isMissingInfo),
      missingInfoQuestions: Array.isArray(parsed.missingInfoQuestions) ? parsed.missingInfoQuestions : [],
      suggestedQuickAnswers: parsed.suggestedQuickAnswers || {},
      aiReasoning: parsed.aiReasoning || "Analyzed by Gemini 3.8 Flash Operations Agent.",
      possibleDuplicates: Array.isArray(parsed.possibleDuplicates) ? parsed.possibleDuplicates : [],
      modelUsed: modelName,
      provider: "gemini",
    };
  } catch (error) {
    console.warn("Live Gemini API call failed, falling back to local simulation:", error);
    const simulated = runLocalSimulation(input);
    simulated.modelUsed = "simulation-fallback";
    simulated.provider = "fallback";
    return simulated;
  }
}
