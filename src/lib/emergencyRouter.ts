import { EmergencyStaffAvailability, EmergencyType } from "./emergencyTypes";
import { getEmergencyStaffList, updateStaffAvailability } from "./emergencyDb";
import { inferEmergencyTypeFromRequirement } from "./emergencyClassifier";

export { inferEmergencyTypeFromRequirement };

interface MatchRule {
  primaryRoles: string[];
  secondaryRoles: string[];
}

const CATEGORY_ROLE_MAP: Record<EmergencyType, MatchRule> = {
  Medical: {
    primaryRoles: ["Medical Response"],
    secondaryRoles: ["Facilities Emergency Responder", "Security Response"],
  },
  "Fire / Smoke": {
    primaryRoles: ["Fire Safety Responder"],
    secondaryRoles: ["Facilities Emergency Responder", "Security Response"],
  },
  "Electrical Hazard": {
    // Both Electrical Maintenance and Facilities Responder can handle
    primaryRoles: ["Facilities Emergency Responder", "Electrical Maintenance Responder"],
    secondaryRoles: ["Fire Safety Responder"],
  },
  "Security / Safety": {
    primaryRoles: ["Security Response"],
    secondaryRoles: ["Facilities Emergency Responder"],
  },
  "Gas Leak": {
    primaryRoles: ["Facilities Emergency Responder", "Fire Safety Responder"],
    secondaryRoles: ["Security Response"],
  },
  Flooding: {
    primaryRoles: ["Facilities Emergency Responder"],
    secondaryRoles: ["Security Response"],
  },
  Other: {
    primaryRoles: ["Facilities Emergency Responder"],
    secondaryRoles: ["Security Response", "Medical Response"],
  },
};



/**
 * Preview which staff responder would be assigned based on requirement or type,
 * without incrementing active emergency counts.
 */
export function previewEmergencyResponder(
  emergencyType?: EmergencyType,
  requirement?: string
): {
  type: EmergencyType;
  responder: EmergencyStaffAvailability | null;
  reason: string;
  matchedKeywords: string[];
} {
  let type = emergencyType;
  let reason = "Direct category selection.";
  let matchedKeywords: string[] = [];

  if (requirement && (!type || type === "Other")) {
    const inferred = inferEmergencyTypeFromRequirement(requirement);
    type = inferred.type;
    reason = inferred.reason;
    matchedKeywords = inferred.matchedKeywords;
  } else if (!type) {
    type = "Electrical Hazard";
  }

  const staffList = getEmergencyStaffList();
  const eligible = staffList.filter((s) => s.isAvailable === true && s.isOnEmergencyDuty === true);
  const pool = eligible.length > 0 ? eligible : staffList;

  const rule = CATEGORY_ROLE_MAP[type] || CATEGORY_ROLE_MAP.Other;
  const primaryCandidates = pool.filter((s) =>
    rule.primaryRoles.some((role) => s.emergencyRole.toLowerCase().includes(role.toLowerCase()))
  );
  const secondaryCandidates = pool.filter((s) =>
    rule.secondaryRoles.some((role) => s.emergencyRole.toLowerCase().includes(role.toLowerCase()))
  );
  const candidatePool =
    primaryCandidates.length > 0
      ? primaryCandidates
      : secondaryCandidates.length > 0
      ? secondaryCandidates
      : pool;

  // Return the best available responder
  const selected = candidatePool[0] || pool[0] || null;

  return {
    type,
    responder: selected,
    reason,
    matchedKeywords,
  };
}

/**
 * Automatically select EXACTLY ONE available responder based on:
 * 1. isAvailable === true
 * 2. isOnEmergencyDuty === true
 * 3. activeEmergencyCount < maxActiveEmergencies
 * 4. appropriate category/role match
 * 5. lowest active load
 * 6. least recently assigned
 */
export function selectEmergencyResponder(
  emergencyType: EmergencyType,
  excludeStaffIds: string[] = []
): EmergencyStaffAvailability | null {
  const staffList = getEmergencyStaffList();

  // Filter only eligible, available on-duty staff not in exclude list
  const eligible = staffList.filter((s) => {
    if (excludeStaffIds.includes(s.staffId) || excludeStaffIds.includes(s.userId)) {
      return false;
    }
    return (
      s.isAvailable === true &&
      s.isOnEmergencyDuty === true &&
      s.activeEmergencyCount < s.maxActiveEmergencies
    );
  });

  if (eligible.length === 0) {
    return null;
  }

  const rule = CATEGORY_ROLE_MAP[emergencyType] || CATEGORY_ROLE_MAP.Other;

  // 1. Try primary role matches
  const primaryCandidates = eligible.filter((s) =>
    rule.primaryRoles.some((role) => s.emergencyRole.toLowerCase().includes(role.toLowerCase()))
  );

  // 2. Try secondary role matches
  const secondaryCandidates = eligible.filter((s) =>
    rule.secondaryRoles.some((role) => s.emergencyRole.toLowerCase().includes(role.toLowerCase()))
  );

  // 3. Fallback candidates (any eligible responder)
  const candidatePool =
    primaryCandidates.length > 0
      ? primaryCandidates
      : secondaryCandidates.length > 0
      ? secondaryCandidates
      : eligible;

  // Sort candidate pool:
  // a) lowest activeEmergencyCount
  // b) least recently assigned (nulls/oldest first)
  candidatePool.sort((a, b) => {
    if (a.activeEmergencyCount !== b.activeEmergencyCount) {
      return a.activeEmergencyCount - b.activeEmergencyCount;
    }
    const aTime = a.lastAssignedEmergency ? new Date(a.lastAssignedEmergency).getTime() : 0;
    const bTime = b.lastAssignedEmergency ? new Date(b.lastAssignedEmergency).getTime() : 0;
    return aTime - bTime;
  });

  const selected = candidatePool[0];

  // Mark staff load & last assigned
  updateStaffAvailability(selected.staffId, {
    activeEmergencyCount: selected.activeEmergencyCount + 1,
    lastAssignedEmergency: new Date().toISOString(),
  });

  return selected;
}
