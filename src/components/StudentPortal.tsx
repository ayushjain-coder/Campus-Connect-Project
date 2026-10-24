import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  MapPin, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle, 
  UploadCloud, 
  X, 
  Search, 
  RotateCcw, 
  Layers, 
  Building2, 
  Clock, 
  Copy, 
  Check, 
  Info,
  GitBranch,
  ShieldCheck,
  Video,
  Film,
  Play,
  Star
} from "lucide-react";
import { 
  AIAnalysisResult, 
  Ticket, 
  Category, 
  Severity, 
  Status 
} from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { TicketTimeline } from "./TicketTimeline";
import { useAuth } from "@/lib/authContext";
import { EmergencyModal } from "./emergency/EmergencyModal";
import { useEmergencyStream } from "@/lib/useEmergencyStream";
import { EmergencyIncident } from "@/lib/emergencyTypes";

// Sample preset photos with royalty-free Unsplash URLs
const SAMPLE_PHOTOS = [
  {
    label: "Water Leak / Pipe",
    category: "Plumbing",
    url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
  },
  {
    label: "Sparking Switch",
    category: "Electricity",
    url: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&auto=format&fit=crop&q=80",
  },
  {
    label: "Overflowing Trash",
    category: "Cleanliness",
    url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80",
  },
  {
    label: "Wi-Fi Access Point",
    category: "Internet Connectivity",
    url: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80",
  },
];

const SAMPLE_VIDEOS = [
  {
    label: "Water Leak Video Clip",
    category: "Plumbing",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    label: "Electrical Hazard Video Clip",
    category: "Electricity",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  },
];

interface StudentPortalProps {
  onTicketCreated: (ticket: Ticket) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  onTicketCreated,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"submit" | "track">("submit");

  // Step state for Submission Wizard
  // 1: initial input -> 2: missing-info clarification (if needed) -> 3: ticket preview -> 4: ticket confirmed
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Form inputs
  const [complaintText, setComplaintText] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [video, setVideo] = useState<string>("");
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [videoName, setVideoName] = useState<string>("");
  const [activeMediaTab, setActiveMediaTab] = useState<"photo" | "video">("photo");
  const [studentName, setStudentName] = useState("Arjun Mehta (Roll: CS-2024-042)");

  useEffect(() => {
    if (user && user.role === "STUDENT") {
      const rollSuffix = user.studentId ? ` (Roll: ${user.studentId})` : "";
      setStudentName(`${user.name}${rollSuffix}`);
    }
  }, [user]);

  // Follow-up responses map: question -> answer
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});

  // AI Analysis result
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Confirmed ticket after POST
  const [confirmedTicket, setConfirmedTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Emergency Response State
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [activeEmergencyIncident, setActiveEmergencyIncident] = useState<EmergencyIncident | null>(null);

  // Load existing student emergencies on mount
  useEffect(() => {
    async function fetchStudentEmergencies() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("cc_auth_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/emergencies", { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.incidents && data.incidents.length > 0) {
            const active = data.incidents.find((i: EmergencyIncident) =>
              ["REPORTED", "STAFF_NOTIFIED", "ACCEPTED", "RESPONDING"].includes(i.status)
            );
            if (active) {
              setActiveEmergencyIncident(active);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load student emergencies:", err);
      }
    }
    fetchStudentEmergencies();
  }, []);

  // Real-time stream updates for student's active emergency
  useEmergencyStream((event) => {
    if (
      event.type === "incident:accepted" ||
      event.type === "incident:updated" ||
      event.type === "incident:declined"
    ) {
      if (activeEmergencyIncident && event.payload?.incident?.id === activeEmergencyIncident.id) {
        setActiveEmergencyIncident(event.payload.incident);
      }
    }
  });

  // Track Tab state: automatically show latest report on top
  const [studentTickets, setStudentTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [trackedTicket, setTrackedTicket] = useState<Ticket | null>(null);
  const [trackedUpdates, setTrackedUpdates] = useState<any[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Rating state for resolved maintenance reports
  const [ratingVal, setRatingVal] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingFeedbackText, setRatingFeedbackText] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSuccessMsg, setRatingSuccessMsg] = useState<string | null>(null);
  const [isEditingRating, setIsEditingRating] = useState(false);

  // Synchronize rating state when tracked ticket changes
  useEffect(() => {
    if (trackedTicket?.rating) {
      setRatingVal(trackedTicket.rating);
      setRatingFeedbackText(trackedTicket.ratingFeedback || "");
      setIsEditingRating(false);
    } else {
      setRatingVal(0);
      setRatingFeedbackText("");
      setIsEditingRating(false);
    }
    setRatingSuccessMsg(null);
  }, [trackedTicket?.ticketId, trackedTicket?.rating]);

  // Submit student rating for a resolved ticket
  const handleRateTicket = async (score: number, feedbackText?: string) => {
    if (!trackedTicket) return;
    setIsSubmittingRating(true);
    setRatingSuccessMsg(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("cc_auth_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/tickets/${trackedTicket.ticketId}/rate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          rating: score,
          feedback: feedbackText !== undefined ? feedbackText : ratingFeedbackText,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit rating.");
      }

      setTrackedTicket(data.ticket);
      if (data.updates) setTrackedUpdates(data.updates);
      setStudentTickets((prev) =>
        prev.map((t) => (t.ticketId === data.ticket.ticketId ? data.ticket : t))
      );
      setRatingVal(score);
      setRatingSuccessMsg(data.message || `Thank you! Your ${score}-star rating has been recorded.`);
      setIsEditingRating(false);
    } catch (err: any) {
      console.error("Error submitting rating:", err);
      alert(err.message || "Failed to submit rating.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Quick preset loader for hackathon scenario
  const loadScenarioA = () => {
    setComplaintText("Water leaking in the library");
    setLocation("Library");
    setPhoto("https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80");
    setPhotoPreview("https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80");
    setFollowUpAnswers({});
    setAnalysis(null);
    setWizardStep(1);
  };

  // Step 1: Initial analyze
  const handleAnalyze = async () => {
    if (!complaintText.trim()) {
      setAnalysisError("Please provide a brief description of the issue.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/analyze-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintText,
          location,
          photo,
          video,
          followUpResponses: followUpAnswers,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Analysis failed.");
      }

      setAnalysis(data.analysis);

      if (data.analysis.isMissingInfo && data.analysis.missingInfoQuestions.length > 0) {
        // Step 2: Gemini found missing information
        setWizardStep(2);
      } else {
        // Step 3: Direct preview
        setWizardStep(3);
      }
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Unable to analyze complaint. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Refine after student answers follow-up questions
  const handleRefineComplaint = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/analyze-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintText,
          location,
          photo,
          video,
          followUpResponses: followUpAnswers,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Refinement failed.");
      }

      setAnalysis(data.analysis);
      setWizardStep(3); // Advance to preview
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Failed to refine ticket.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 3: Final submission
  const handleSubmitTicket = async () => {
    if (!analysis) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintText,
          summary: analysis.summary,
          category: analysis.category,
          department: analysis.suggestedDepartment,
          location: analysis.location || location,
          severity: analysis.severity,
          severityReason: analysis.severityReason,
          photo: photo || undefined,
          video: video || undefined,
          submittedBy: studentName,
          extractedDetails: analysis.extractedDetails,
          aiReasoning: analysis.aiReasoning,
          aiProvider: analysis.provider,
          followUpResponses: followUpAnswers,
          duplicateMatches: analysis.possibleDuplicates,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to submit ticket.");
      }

      setConfirmedTicket(data.ticket);
      onTicketCreated(data.ticket);
      setWizardStep(4);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Could not submit ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Photo file upload helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhoto(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  // Video file upload helper
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setAnalysisError("Video file size exceeds 50MB limit. Please attach a shorter clip.");
      return;
    }

    setVideoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setVideo(result);
      setVideoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  // Auto-fetch reports sorted by latest first
  const fetchStudentReports = async (selectTicketId?: string) => {
    setLoadingTickets(true);
    setTrackError(null);
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (data.success && data.tickets) {
        // Sort latest first
        const sorted: Ticket[] = [...data.tickets].sort((a: Ticket, b: Ticket) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setStudentTickets(sorted);

        const targetId = selectTicketId || (sorted.length > 0 ? sorted[0].ticketId : null);
        if (targetId) {
          handleSelectReport(targetId);
        }
      }
    } catch (err: any) {
      console.error("Failed to load reports:", err);
      setTrackError("Could not load reports.");
    } finally {
      setLoadingTickets(false);
    }
  };

  // Load ticket details and timeline for a selected report
  const handleSelectReport = async (ticketId: string) => {
    setIsTracking(true);
    setTrackError(null);
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Report details not found.");
      }

      setTrackedTicket(data.ticket);
      setTrackedUpdates(data.updates || []);
    } catch (err: any) {
      setTrackError(err.message || "Failed to load report progress.");
      setTrackedTicket(null);
    } finally {
      setIsTracking(false);
    }
  };

  // Automatically fetch reports whenever entering Track tab
  useEffect(() => {
    if (activeTab === "track") {
      fetchStudentReports();
    }
  }, [activeTab]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="student-daylight max-w-6xl mx-auto px-4 sm:px-6 py-9 sm:py-12">
      {/* Sub-navigation Tabs: Submit vs Track */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E4E0D6] pb-8 mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#14182B]">
            CampusConnect
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Report it. We’ll route it.
          </p>
          <p className="text-sm text-[#666A73] mt-3 max-w-xl leading-relaxed">Tell us what went wrong. Our AI understands the issue, identifies what information is needed, and routes your request to the right campus team.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Prominent Emergency Button */}
          <button
            type="button"
            onClick={() => setIsEmergencyOpen(true)}
            className="emergency-attention px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:from-red-800 active:to-rose-800 active:scale-[0.97] text-white font-black text-xs tracking-widest uppercase shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-150 flex items-center gap-2 border border-red-500/70 hover:scale-[1.02]"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span>🚨 EMERGENCY</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("submit")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "submit"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Submit Report
            </button>
            <button
              onClick={() => setActiveTab("track")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "track"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Track Status
            </button>
          </div>
        </div>
      </div>

      {/* Active Emergency Banner if in progress */}
      {activeEmergencyIncident && ["REPORTED", "STAFF_NOTIFIED", "ACCEPTED", "RESPONDING"].includes(activeEmergencyIncident.status) && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-red-500/15 via-rose-500/10 to-red-500/15 border-2 border-red-500/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <span className="relative flex h-3.5 w-3.5 mt-0.5 sm:mt-0 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase text-red-600 dark:text-red-400 tracking-wider">
                  ACTIVE EMERGENCY DISPATCH ({activeEmergencyIncident.id})
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white uppercase">
                  {activeEmergencyIncident.status}
                </span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-100 font-bold">
                {activeEmergencyIncident.type} • {activeEmergencyIncident.location.building}, {activeEmergencyIncident.location.room}
              </p>
              {activeEmergencyIncident.assignedStaffName && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <span>Assigned Specialist: <strong className="text-slate-900 dark:text-white">{activeEmergencyIncident.assignedStaffName}</strong> ({activeEmergencyIncident.assignedStaffRole || "Emergency Lead"})</span>
                  {activeEmergencyIncident.assignedStaffPhone && (
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      📞 {activeEmergencyIncident.assignedStaffPhone}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {activeEmergencyIncident.assignedStaffPhone && (
              <a
                href={`tel:${activeEmergencyIncident.assignedStaffPhone}`}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs shadow-md transition flex items-center gap-1.5"
              >
                <span>📞 Call {activeEmergencyIncident.assignedStaffPhone}</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setIsEmergencyOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs shadow-md transition flex items-center gap-1.5"
            >
              <span>OPEN EMERGENCY ROOM</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: SUBMIT REPORT */}
      {activeTab === "submit" && (
        <div className="space-y-6">
          {/* Quick Demo Pre-fill Bar */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Hackathon Demo Scenario:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadScenarioA}
                className="px-3 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 font-semibold border border-indigo-200 rounded-lg shadow-2xs transition-colors"
              >
                1-Click Load Incomplete Water Leak (Library)
              </button>
            </div>
          </div>

          {/* Step 1: Initial Input Form */}
          {wizardStep === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Step 1 of 3
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  What happened?
                </h2>
                <p className="text-xs text-slate-500">
                  Describe the issue in your own words. We’ll help organize the details before you submit.
                </p>
              </div>

              {analysisError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}

              {/* Complaint Text */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Report description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="Example: There’s water leaking near the library bathroom..."
                  rows={4}
                  aria-label="Report description"
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Location Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      aria-label="Where is the issue?"
                      placeholder="e.g. Central Library, 2nd Floor, Restroom 204"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Submitted By
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-700"
                  />
                </div>
              </div>

              {/* Media Evidence (Photo & Video) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Media Evidence · Optional
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("photo")}
                      className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${
                        activeMediaTab === "photo"
                          ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Photo</span>
                      {photoPreview && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("video")}
                      className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${
                        activeMediaTab === "video"
                          ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Video</span>
                      {videoPreview && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </button>
                  </div>
                </div>

                {/* Photo Tab Content */}
                {activeMediaTab === "photo" && (
                  <div>
                    {photoPreview ? (
                      <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 max-w-sm">
                        <img
                          src={photoPreview}
                          alt="Complaint Preview"
                          className="w-full h-48 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhoto("");
                            setPhotoPreview("");
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                          title="Remove image"
                          aria-label="Remove attached image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl bg-slate-50/50 hover:bg-indigo-50/20 cursor-pointer transition-all">
                          <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
                          <span className="text-xs font-semibold text-slate-700">
                            Upload photo from device or drag & drop
                          </span>
                          <span className="text-[11px] text-slate-400 mt-0.5">
                            PNG, JPG, WebP up to 5MB
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleFileUpload}
                          />
                        </label>

                        {/* Quick Demo Photo Presets */}
                        <div className="mt-2.5">
                          <span className="text-[11px] font-medium text-slate-500 mr-2">
                            Or pick a sample photo:
                          </span>
                          <div className="inline-flex flex-wrap gap-2 mt-1">
                            {SAMPLE_PHOTOS.map((sp) => (
                              <button
                                key={sp.label}
                                type="button"
                                onClick={() => {
                                  setPhoto(sp.url);
                                  setPhotoPreview(sp.url);
                                }}
                                className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 border border-slate-200 transition-colors"
                              >
                                {sp.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Video Tab Content */}
                {activeMediaTab === "video" && (
                  <div>
                    {videoPreview ? (
                      <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-black max-w-md">
                        <video
                          src={videoPreview}
                          controls
                          className="w-full max-h-56 object-contain"
                          preload="metadata"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setVideo("");
                            setVideoPreview("");
                            setVideoName("");
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors z-10"
                          title="Remove video"
                          aria-label="Remove attached video"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {videoName && (
                          <div className="px-3 py-1.5 bg-slate-900 text-slate-300 text-[11px] truncate flex items-center gap-1.5">
                            <Film className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate">{videoName}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl bg-indigo-50/30 hover:bg-indigo-50/50 cursor-pointer transition-all">
                          <Video className="w-8 h-8 text-indigo-600 mb-2" />
                          <span className="text-xs font-semibold text-slate-800">
                            Upload video recording from device
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            MP4, WebM, QuickTime MOV up to 50MB
                          </span>
                          <input
                            type="file"
                            accept="video/*"
                            className="sr-only"
                            onChange={handleVideoUpload}
                          />
                        </label>

                        {/* Quick Demo Video Presets */}
                        <div className="mt-2.5">
                          <span className="text-[11px] font-medium text-slate-500 mr-2">
                            Or pick a sample video clip:
                          </span>
                          <div className="inline-flex flex-wrap gap-2 mt-1">
                            {SAMPLE_VIDEOS.map((sv) => (
                              <button
                                key={sv.label}
                                type="button"
                                onClick={() => {
                                  setVideo(sv.url);
                                  setVideoPreview(sv.url);
                                  setVideoName(sv.label);
                                }}
                                className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors flex items-center gap-1"
                              >
                                <Play className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                                <span>{sv.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Status summary showing what's attached */}
                {(photoPreview || videoPreview) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="text-[11px] text-slate-400 font-semibold">Attached:</span>
                    {photoPreview && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                        <ImageIcon className="w-3 h-3" /> Photo Attached
                      </span>
                    )}
                    {videoPreview && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium">
                        <Video className="w-3 h-3" /> Video Attached
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isAnalyzing && (
                <div className="signal-trace" role="status" aria-live="polite" aria-label="AI analysis in progress">
                  <div className="flex items-center gap-2 mb-4 font-semibold text-[#0B7F76]"><GitBranch className="w-4 h-4" /> AI triage · Processing your report</div>
                  <ol className="signal-thread">
                    {['Reading your report', 'Understanding the issue', 'Identifying location', 'Assessing severity', 'Routing to campus team', 'Checking similar reports'].map((stage) => (
                      <li key={stage}><span className="signal-node" aria-hidden="true" /><span>{stage}</span></li>
                    ))}
                  </ol>
                  <p className="text-xs text-[#666A73] mt-3">These are the analysis stages, not live progress indicators. Results will appear when processing finishes.</p>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-200 transition-all disabled:opacity-60"
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-indigo-200" />
                      <span>Analyzing your report...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      <span>Analyze with AI</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Missing Information Clarification Card */}
          {wizardStep === 2 && analysis && (
            <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div className="flex items-start justify-between gap-4 border-b border-indigo-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Additional Information Needed
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    One more detail needed
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    A few details will help us route your report accurately.
                  </p>
                </div>
                <CategoryBadge category={analysis.category} />
              </div>

              {/* Questions list with suggested quick answer chips */}
              <div className="space-y-5">
                {analysis.missingInfoQuestions.map((q, idx) => {
                  const quickOptions = analysis.suggestedQuickAnswers?.[q] || [];
                  const currentAnswer = followUpAnswers[q] || "";

                  return (
                    <div
                      key={q}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                    >
                      <label className="block text-xs font-bold text-slate-800">
                        {idx + 1}. {q}
                      </label>

                      {/* Quick chips */}
                      {quickOptions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {quickOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setFollowUpAnswers((prev) => ({
                                  ...prev,
                                  [q]: opt,
                                }))
                              }
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                                currentAnswer === opt
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                  : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Free-form text input */}
                      <input
                        type="text"
                        value={currentAnswer}
                        onChange={(e) =>
                          setFollowUpAnswers((prev) => ({
                            ...prev,
                            [q]: e.target.value,
                          }))
                        }
                        placeholder="Or type specific details here..."
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Back to edit complaint
                </button>

                <button
                  type="button"
                  onClick={handleRefineComplaint}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-60"
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Refining structured ticket...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Structured Preview</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: AI-Generated Structured Ticket Preview & Duplicate Detection */}
          {wizardStep === 3 && analysis && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* DUPLICATE DETECTION BANNER (if matches found) */}
              {analysis.possibleDuplicates && analysis.possibleDuplicates.length > 0 && (
                <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center gap-2.5 text-amber-900 font-bold text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Possible duplicate reports found</span>
                  </div>

                  <p className="text-xs text-amber-800">
                    Similar existing reports were identified during analysis. Reports are not automatically merged so staff can review both.
                  </p>

                  <div className="space-y-2 mt-2">
                    {analysis.possibleDuplicates.map((dup) => (
                      <div
                        key={dup.matchedTicketId}
                        className="p-3 bg-white/90 border border-amber-200 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            Matching Ticket #{dup.matchedTicketId}
                          </span>
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            {Math.round(dup.similarityScore * 100)}% Match
                          </span>
                        </div>
                        <p className="text-slate-600">{dup.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <section className="signal-trace" aria-label="AI triage result">
                <div className="flex items-center gap-2 text-[#0B7F76] font-bold text-xs tracking-widest uppercase mb-4"><GitBranch className="w-4 h-4" /> AI triage · Signal thread</div>
                <ol className="signal-thread signal-result">
                  {[
                    ['Understood', analysis.summary],
                    ['Category', analysis.category],
                    ['Department', analysis.suggestedDepartment],
                    ['Location', analysis.location || location || 'Not specified'],
                    ['Severity', `${analysis.severity}${analysis.severityReason ? ' · ' + analysis.severityReason : ''}`],
                    ['Similar incidents', analysis.possibleDuplicates?.length ? analysis.possibleDuplicates.map(d => `${d.matchedTicketId} (${Math.round(d.similarityScore * 100)}% match)`).join(', ') : 'No similar reports returned'],
                    ['Draft ticket', 'Ready to submit']
                  ].map(([label, value]) => (
                    <li key={label}><span className="signal-node" aria-hidden="true"><Check className="w-3 h-3" /></span><div><span className="signal-label">{label}</span><p className="text-sm text-[#14182B] mt-1 leading-relaxed">{value}</p></div></li>
                  ))}
                </ol>
              </section>

              {/* AI-Generated Ticket Preview Card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 bg-[#14182B] text-white flex flex-wrap gap-4 items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        AI Triage Verification
                      </div>
                      {analysis.provider === "gemini" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-semibold">
                          Live Gemini
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] font-semibold">
                          Demo Fallback
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">
                      Ready to submit
                    </h2>
                    <p className="text-xs text-slate-300">
                      Review the AI triage before submitting your report.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <CategoryBadge category={analysis.category} size="lg" />
                    <SeverityBadge severity={analysis.severity} size="lg" />
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Summary & Department */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Issue Summary
                      </span>
                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {analysis.summary}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Suggested Department
                      </span>
                      <p className="text-sm font-semibold text-indigo-700 mt-1 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 shrink-0" />
                        {analysis.suggestedDepartment}
                      </p>
                    </div>
                  </div>

                  {/* Location & Reported By */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200">
                      <span className="font-semibold text-slate-500 block mb-1">
                        Specific Location:
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span>{analysis.location || location}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200">
                      <span className="font-semibold text-slate-500 block mb-1">
                        Reported By:
                      </span>
                      <span className="text-slate-800 font-medium">{studentName}</span>
                    </div>
                  </div>

                  {/* AI Severity Explanation */}
                  {analysis.severityReason && (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
                      <span className="font-bold text-amber-900 block mb-1 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Severity Rationale ({analysis.severity}):
                      </span>
                      <p className="text-amber-900/90 leading-relaxed font-medium">
                        {analysis.severityReason}
                      </p>
                    </div>
                  )}

                  {/* Extracted Details */}
                  {analysis.extractedDetails && analysis.extractedDetails.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Important Extracted Operational Details
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {analysis.extractedDetails.map((det, i) => (
                          <li
                            key={i}
                            className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100/70 text-slate-700 flex items-start gap-2"
                          >
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>{det}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Reasoning */}
                  {analysis.aiReasoning && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        AI operations reasoning:
                      </span>
                      <p className="text-slate-600 leading-relaxed italic">
                        "{analysis.aiReasoning}"
                      </p>
                    </div>
                  )}

                  {/* Photo if present */}
                  {photoPreview && (
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                        Attached Photo Evidence
                      </span>
                      <img
                        src={photoPreview}
                        alt="Evidence"
                        className="w-48 h-32 object-cover rounded-xl border border-slate-200 shadow-2xs"
                      />
                    </div>
                  )}

                  {/* Video if present */}
                  {videoPreview && (
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-indigo-600" />
                        Attached Video Evidence
                      </span>
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-black max-w-sm shadow-2xs">
                        <video
                          src={videoPreview}
                          controls
                          className="w-full max-h-48 object-contain"
                          preload="metadata"
                        />
                      </div>
                    </div>
                  )}

                  {/* Confirmation Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      ← Edit Report
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmitTicket}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-200 transition-all disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Submitting report...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmed Ticket View */}
          {wizardStep === 4 && confirmedTicket && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-card dark:shadow-card-dark space-y-6 text-center animate-in zoom-in-95 duration-200 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Ticket Created Successfully
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                  Ticket #{confirmedTicket.ticketId}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                  Your maintenance report has been logged with initial status{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">NEW</span>. Campus operations staff have been notified.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200">
                <span className="font-bold">#{confirmedTicket.ticketId}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(confirmedTicket.ticketId)}
                  className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-md"
                  title="Copy Ticket ID"
                  aria-label="Copy Ticket ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="max-w-md mx-auto grid grid-cols-2 gap-3 text-left text-xs bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{confirmedTicket.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Severity</span>
                  <div className="mt-0.5">
                    <SeverityBadge severity={confirmedTicket.severity} size="sm" />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{confirmedTicket.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Department</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{confirmedTicket.department}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("track");
                    fetchStudentReports(confirmedTicket.ticketId);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-150"
                >
                  Track this report →
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setComplaintText("");
                    setLocation("");
                    setPhoto("");
                    setPhotoPreview("");
                    setFollowUpAnswers({});
                    setAnalysis(null);
                    setConfirmedTicket(null);
                    setWizardStep(1);
                  }}
                  className="px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Submit Another Report
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRACK TICKET STATUS & PROGRESS HISTORY */}
      {activeTab === "track" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-card dark:shadow-card-dark transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Track Report Status
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Latest Report On Top
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {studentTickets.length > 0
                    ? `Showing ${studentTickets.length} report${studentTickets.length > 1 ? "s" : ""} sorted with newest first`
                    : "Real-time lifecycle tracking of campus maintenance requests"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchStudentReports(trackedTicket?.ticketId)}
              disabled={loadingTickets || isTracking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-150 shadow-2xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loadingTickets || isTracking ? "animate-spin text-indigo-600" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {trackError && (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{trackError}</span>
            </div>
          )}

          {/* Loading Skeleton */}
          {loadingTickets && !trackedTicket && (
            <div className="p-8 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
              <div className="h-6 w-48 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-20 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-32 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
          )}

          {/* Empty State when no reports exist */}
          {!loadingTickets && studentTickets.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-[#111827] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-card space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  No maintenance reports yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  When you report an issue, it will automatically appear here with real-time lifecycle tracking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("submit")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
              >
                <span>Submit Your First Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Report Selector Feed (Newest First) */}
          {studentTickets.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  Recent Reports ({studentTickets.length}) · Newest On Top
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Click any report to view its full timeline
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {studentTickets.map((t, idx) => {
                  const isSelected = trackedTicket?.ticketId === t.ticketId;
                  const isLatest = idx === 0;

                  return (
                    <button
                      key={t.ticketId}
                      type="button"
                      onClick={() => handleSelectReport(t.ticketId)}
                      className={`text-left p-3.5 rounded-xl border transition-all duration-150 relative ${
                        isSelected
                          ? "bg-white dark:bg-[#111827] border-indigo-500 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                          : "bg-white/70 dark:bg-[#111827]/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-[#111827]"
                      }`}
                    >
                      {isLatest && (
                        <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[9px] font-black uppercase tracking-wider">
                          Latest
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 dark:text-white flex-wrap">
                        <span>#{t.ticketId}</span>
                        <StatusBadge status={t.status} size="sm" showIcon={false} />
                        {t.rating && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/70 px-1.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                            {t.rating}/5
                          </span>
                        )}
                        {t.status === "RESOLVED" && !t.rating && (
                          <span className="text-[9px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100/80 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-700">
                            ⭐ Rate
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate mt-1">
                        {t.summary}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                        <span className="truncate">{t.location}</span>
                        <span className="shrink-0 font-mono">
                          {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full Active / Selected Tracked Report Detail Card */}
          {trackedTicket && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800/90 overflow-hidden shadow-card dark:shadow-card-dark space-y-6 p-6 sm:p-8 animate-in fade-in duration-200 transition-colors">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                      #{trackedTicket.ticketId}
                    </span>
                    <StatusBadge status={trackedTicket.status} size="md" />
                    <SeverityBadge severity={trackedTicket.severity} size="sm" />
                    {trackedTicket.rating && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-black">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{trackedTicket.rating}/5 Rated</span>
                      </span>
                    )}
                    {studentTickets[0]?.ticketId === trackedTicket.ticketId && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold uppercase tracking-wider">
                        Latest Report
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {trackedTicket.summary}
                  </h3>
                </div>

                <CategoryBadge category={trackedTicket.category} size="md" />
              </div>

              {/* Metadata Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                    Location
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{trackedTicket.location}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                    Assigned Technician
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {trackedTicket.assignedTo || "Pending assignment"}
                    </span>
                    {trackedTicket.assignedTo && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                        ⚖️ Equal Dispatch
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                    Department
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                    {trackedTicket.department}
                  </span>
                </div>
              </div>

              {/* Attached Media Evidence (Photo / Video) */}
              {(trackedTicket.photo || trackedTicket.video) && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                    Attached Evidence
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {trackedTicket.photo && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-indigo-500" /> Photo Evidence
                        </span>
                        <a
                          href={trackedTicket.photo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 max-h-48"
                        >
                          <img
                            src={trackedTicket.photo}
                            alt="Ticket photo"
                            className="w-full h-44 object-cover hover:scale-102 transition-transform"
                          />
                        </a>
                      </div>
                    )}
                    {trackedTicket.video && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Video className="w-3 h-3 text-indigo-500" /> Video Evidence
                        </span>
                        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black max-h-48">
                          <video
                            src={trackedTicket.video}
                            controls
                            className="w-full h-44 object-contain"
                            preload="metadata"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Severity Rationale Banner */}
              {trackedTicket.severityReason && (
                <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Severity Rationale ({trackedTicket.severity}):
                  </span>
                  <p className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                    {trackedTicket.severityReason}
                  </p>
                </div>
              )}

              {/* Resolution Banner if Resolved */}
              {trackedTicket.status === "RESOLVED" && trackedTicket.resolutionNotes && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Resolution Information</span>
                  </div>
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                    {trackedTicket.resolutionNotes}
                  </p>
                </div>
              )}

              {/* ────────────────── STUDENT RATING & FEEDBACK SECTION ────────────────── */}
              {trackedTicket.status === "RESOLVED" && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-slate-800/90 dark:via-slate-800 dark:to-amber-950/20 border-2 border-amber-300 dark:border-amber-700/80 shadow-md space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
                        <Star className="w-4 h-4 fill-white" />
                      </span>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          Rate Resolution & Service Quality
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          How satisfied are you with the resolution provided by <strong>{trackedTicket.assignedTo || "the maintenance team"}</strong>?
                        </p>
                      </div>
                    </div>
                    {trackedTicket.rating && !isEditingRating && (
                      <button
                        type="button"
                        onClick={() => setIsEditingRating(true)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                      >
                        Edit Rating
                      </button>
                    )}
                  </div>

                  {trackedTicket.rating && !isEditingRating ? (
                    /* Display verified submitted rating */
                    <div className="space-y-3 bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= (trackedTicket.rating || 0)
                                    ? "fill-amber-400 text-amber-500"
                                    : "text-slate-300 dark:text-slate-700"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {trackedTicket.rating} of 5 Stars
                          </span>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          ✓ Student Feedback Recorded
                        </span>
                      </div>

                      {trackedTicket.ratingFeedback && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-amber-50/60 dark:bg-slate-800/60 p-3 rounded-lg border border-amber-100 dark:border-slate-700 leading-relaxed">
                          "{trackedTicket.ratingFeedback}"
                        </p>
                      )}

                      {trackedTicket.ratedAt && (
                        <p className="text-[10px] text-slate-400">
                          Submitted on {new Date(trackedTicket.ratedAt).toLocaleDateString()} at {new Date(trackedTicket.ratedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Interactive 1-5 Star Selection & Feedback Form */
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const active = hoverRating ? star <= hoverRating : star <= ratingVal;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingVal(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="p-1 text-slate-300 hover:scale-125 transition-transform duration-100 focus:outline-none"
                                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                              >
                                <Star
                                  className={`w-7 h-7 transition-colors ${
                                    active
                                      ? "fill-amber-400 text-amber-500"
                                      : "text-slate-300 dark:text-slate-700"
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                          {(hoverRating || ratingVal) === 1 && "⭐ 1 Star · Poor Service"}
                          {(hoverRating || ratingVal) === 2 && "⭐⭐ 2 Stars · Fair / Partially Solved"}
                          {(hoverRating || ratingVal) === 3 && "⭐⭐⭐ 3 Stars · Good / Satisfactory"}
                          {(hoverRating || ratingVal) === 4 && "⭐⭐⭐⭐ 4 Stars · Very Good / Prompt"}
                          {(hoverRating || ratingVal) === 5 && "⭐⭐⭐⭐⭐ 5 Stars · Outstanding / Highly Recommended!"}
                          {!(hoverRating || ratingVal) && "Select your rating"}
                        </span>
                      </div>

                      {/* Quick Feedback Chips */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Quick Feedback Tags (Click to add):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "⚡ Fast response",
                            "🤝 Polite technician",
                            "✅ Issue fully resolved",
                            "🧹 Clean work area",
                            "🔧 High quality repair"
                          ].map((chip) => {
                            const isIncluded = ratingFeedbackText.includes(chip);
                            return (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => {
                                  setRatingFeedbackText((prev) =>
                                    prev.includes(chip)
                                      ? prev.replace(chip, "").replace(/^[,\s]+|[,\s]+$/g, "").replace(/,\s*,/g, ", ")
                                      : prev ? `${prev}, ${chip}` : chip
                                  );
                                }}
                                className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                                  isIncluded
                                    ? "bg-amber-500 text-white border-amber-600 font-bold shadow-xs"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                                }`}
                              >
                                {chip}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Written Feedback Textarea */}
                      <div className="space-y-1">
                        <textarea
                          rows={2}
                          value={ratingFeedbackText}
                          onChange={(e) => setRatingFeedbackText(e.target.value)}
                          placeholder="Share your thoughts on the resolution or technician (optional)..."
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none leading-relaxed"
                        />
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-1">
                        {ratingSuccessMsg ? (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            {ratingSuccessMsg}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Your rating helps improve campus facilities.
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          {isEditingRating && (
                            <button
                              type="button"
                              onClick={() => setIsEditingRating(false)}
                              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isSubmittingRating || ratingVal === 0}
                            onClick={() => handleRateTicket(ratingVal, ratingFeedbackText)}
                            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-500/25 transition disabled:opacity-40 flex items-center gap-1.5"
                          >
                            {isSubmittingRating ? (
                              <span>Submitting rating...</span>
                            ) : (
                              <>
                                <Star className="w-3.5 h-3.5 fill-white" />
                                <span>{isEditingRating ? "Update Rating" : "Submit Rating"}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Complete Progress History Timeline */}
              <div className="pt-2">
                <TicketTimeline
                  updates={trackedUpdates}
                  currentStatus={trackedTicket.status}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Emergency Response System Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        activeIncident={activeEmergencyIncident}
        onIncidentCreated={(inc) => {
          setActiveEmergencyIncident(inc);
          setIsEmergencyOpen(true);
        }}
      />
    </div>
  );
};
