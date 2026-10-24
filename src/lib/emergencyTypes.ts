export type EmergencyType = 
  | "Medical" 
  | "Fire / Smoke" 
  | "Electrical Hazard" 
  | "Security / Safety" 
  | "Gas Leak" 
  | "Flooding" 
  | "Other";

export type EmergencyStatus = 
  | "REPORTED" 
  | "STAFF_NOTIFIED" 
  | "ACCEPTED" 
  | "RESPONDING" 
  | "RESOLVED" 
  | "DECLINED" 
  | "TRANSFERRED" 
  | "CANCELLED";

export interface EmergencyLocation {
  building: string;
  floor: string;
  room: string;
}

export interface EmergencyIncident {
  id: string; // e.g., "EMG-2026-0001"
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  studentRoll?: string;
  type: EmergencyType;
  location: EmergencyLocation;
  description: string;
  photo?: string;
  peopleAffected?: number;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffPhone?: string;
  assignedStaffRole?: string;
  status: EmergencyStatus;
  aiSeverity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  aiReasoning?: string;
  aiRecommendations?: string[];
  createdAt: string;
  acceptedAt?: string;
  respondingAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  rating?: number;
  ratingFeedback?: string;
  ratedAt?: string;
}

export interface EmergencyStaffAvailability {
  staffId: string;
  userId: string;
  name: string;
  phoneNumber: string;
  department: string;
  emergencyRole: string;
  isAvailable: boolean;
  isOnEmergencyDuty: boolean;
  lastAssignedEmergency?: string;
  activeEmergencyCount: number;
  maxActiveEmergencies: number;
  notificationEnabled: boolean;
  updatedAt: string;
}

export interface EmergencyMessage {
  id: string;
  emergencyId: string;
  senderId: string;
  senderName: string;
  senderRole: "STUDENT" | "STAFF" | "SYSTEM";
  message: string;
  createdAt: string;
}

export type EmergencyEventType =
  | "incident:created"
  | "incident:accepted"
  | "incident:declined"
  | "incident:updated"
  | "message:created"
  | "availability:updated";

export interface EmergencyStreamEvent {
  type: EmergencyEventType;
  payload: any;
  timestamp: string;
}
