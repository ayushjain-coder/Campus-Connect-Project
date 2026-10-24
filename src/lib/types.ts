export type Category = 
  | "Plumbing" 
  | "Electricity" 
  | "Cleanliness" 
  | "Internet Connectivity";

export type Status = 
  | "NEW" 
  | "ASSIGNED" 
  | "IN_PROGRESS" 
  | "RESOLVED"
  | "VERIFIED"
  | "CLOSED";

export type Severity = 
  | "LOW" 
  | "MEDIUM" 
  | "HIGH" 
  | "CRITICAL";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "staff" | "warden" | "admin";
  department?: string;
  avatar?: string;
  phone?: string;
}

export interface Ticket {
  ticketId: string;
  slaDeadline?: string;
  affectedStudents?: number;
  isEmergency?: boolean;
  priorityScore?: number;
  building?: string;
  floor?: string;
  room?: string;
  subcategory?: string;
  complaintText: string;
  summary: string;
  category: Category;
  department: string;
  location: string;
  severity: Severity;
  severityReason?: string;
  photo?: string;
  video?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  submittedBy: string;
  assignedTo: string;
  extractedDetails: string[];
  resolutionNotes?: string;
  resolvedAt?: string | null;
  rating?: number;
  ratingFeedback?: string;
  ratedAt?: string;
  aiReasoning?: string;
  aiProvider?: "gemini" | "fallback";
  followUpResponses?: Record<string, string>;
}

export interface TicketUpdate {
  id: string;
  ticketId: string;
  status: Status;
  note: string;
  updatedBy: string;
  timestamp: string;
}

export interface DuplicateMatch {
  id: string;
  ticketId: string;
  matchedTicketId: string;
  reason: string;
  similarityScore: number;
  createdAt: string;
}

export interface AIAnalysisResult {
  summary: string;
  category: Category;
  suggestedDepartment: string;
  location: string;
  severity: Severity;
  severityReason: string;
  extractedDetails: string[];
  isMissingInfo: boolean;
  missingInfoQuestions: string[];
  suggestedQuickAnswers?: Record<string, string[]>;
  aiReasoning: string;
  possibleDuplicates?: {
    matchedTicketId: string;
    similarityScore: number;
    reason: string;
  }[];
  modelUsed: string;
  provider: "gemini" | "fallback";
}
