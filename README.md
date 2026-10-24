# CampusConnect — AI Campus Operations Agent

> **Production-Quality Hackathon MVP**  
> An intelligent campus maintenance reporting and dispatch system powered by **Google Gemini 3.8 Flash**. Converts unstructured student complaints and photos into structured, actionable tickets that operations staff manage and students track in real time.

---

## 🎯 Core Features & Scope

### Exactly 4 Campus Categories:
1. **Plumbing** → Routed to *Facilities & Hydraulic Maintenance*
2. **Electricity** → Routed to *Campus Electrical & Power Operations*
3. **Cleanliness** → Routed to *Campus Hygiene & Sanitation Services*
4. **Internet Connectivity** → Routed to *IT & Network Infrastructure*

### 🤖 Gemini AI Capabilities
- **Complaint Understanding**: Extracts concise summaries, normalized locations, and key operational details.
- **Multimodal Visual Evidence**: Analyzes uploaded photographs (pipe leaks, scorched sockets, trash accumulation, AP lights) to calibrate severity.
- **Missing Information Detection**: Automatically identifies vague or incomplete complaints and prompts the student with targeted follow-up questions and quick-reply chips.
- **Duplicate Detection & Reasoning**: Scans active campus tickets and flags potential duplicates with similarity confidence and human-readable reasoning (without auto-merging).
- **Intelligent Fallback Engine**: Works seamlessly with live Gemini 3.8 Flash via `@google/genai` when `GEMINI_API_KEY` is present, with an intelligent built-in simulation fallback for offline hackathon demos.

---

## 🔄 Lifecycle Status Flow
```
NEW ───▶ ASSIGNED ───▶ IN_PROGRESS ───▶ RESOLVED
```
Every status transition appends an audit event to `ticket_updates` to maintain a tamper-evident timeline for both staff and students.

---

## 🚀 10-Step Hackathon Demo Scenario

The application includes a built-in interactive **Demo Walkthrough Guide** accessible from the header:

1. **Submit Incomplete Complaint**: Student enters *"Water leaking in the library"* without floor or fixture details.
2. **Gemini Identifies Missing Information**: Flags `isMissingInfo: true` and generates targeted follow-up questions.
3. **Student Answers Questions**: Student clicks quick chips: *"2nd Floor Restroom"* and *"Continuous steady drip into basin"*.
4. **AI Generates Structured Ticket**: Formats preview with summary, category (*Plumbing*), department (*Facilities & Hydraulic Maintenance*), and severity (*MEDIUM/HIGH*).
5. **System Detects Possible Duplicate**: Flags active ticket `#CC-2026-1002` already reporting a water leak in the Library 2nd floor with 94% similarity and reasoning.
6. **Staff Reviews Ticket**: Ticket is logged with status `NEW`. Staff opens the ticket in the Operations Dashboard.
7. **Staff Assigns Ticket**: Assigned to *Rajesh Kumar (Facilities & Hydraulic Maintenance)*.
8. **Staff Changes Status to In Progress**: Adds on-site note *"Technician arrived, isolated secondary shutoff valve"*.
9. **Staff Resolves Ticket**: Adds resolution notes *"Replaced worn-out P-trap rubber seal and wet-vacuumed hallway carpet"* and marks as `RESOLVED`.
10. **Student Sees Complete Progress History**: In the *Track Status* tab, student views the full milestone bar and chronological timeline from submission through resolution.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React
- **Backend / APIs**: Next.js Route Handlers (`/api/analyze-complaint`, `/api/tickets`, `/api/tickets/[id]`, `/api/stats`, `/api/seed`)
- **AI**: `@google/genai` (Gemini 3.8 Flash) with structured JSON schemas & multimodal inline image analysis
- **Database**: Zero-dependency persistent JSON store (`data/campusconnect-db.json`) modeling:
  - `users` (students & specialized staff)
  - `tickets` (lifecycle state, classification, operational specs)
  - `ticket_updates` (audit trail & progress timeline)
  - `duplicate_matches` (detected duplicate pairs with similarity reasoning)

---

## 📦 Getting Started

### 1. Set Workspace & Install Dependencies
```bash
cd "C:\Users\Ayush Jain\.gemini\antigravity\scratch\campusconnect"
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```
*(Note: If `GEMINI_API_KEY` is left blank, CampusConnect automatically runs its built-in intelligent simulation fallback engine so you can still present the entire demo offline without crashing!)*

### 3. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Build & Run Production Mode
```bash
npm run build
npm start
```

### 5. Run Automated Verification Test
```bash
node test/http-test.js
```
