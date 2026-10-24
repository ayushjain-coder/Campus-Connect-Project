import { EmergencyType } from "./emergencyTypes";

/**
 * Pure, client-safe emergency requirement classification.
 * Matches student requirements to emergency types and specialized responder roles.
 */
export function inferEmergencyTypeFromRequirement(requirement: string): {
  type: EmergencyType;
  suggestedRole: string;
  matchedKeywords: string[];
  reason: string;
} {
  const text = (requirement || "").toLowerCase().trim();

  if (/doctor|medic|unconscious|faint|bleed|heart|pulse|chest pain|asthma|breath|seizure|chok|fractur|injur|wound|burn|allergic|ambulance|vomit|head injury|casualty|pain|collapsed|fell down|sick|poison|dizzy|unresponsive/i.test(text)) {
    return {
      type: "Medical",
      suggestedRole: "Medical Response",
      matchedKeywords: ["health/medical urgency", "physical trauma/injury"],
      reason: "Classified as Medical emergency based on physiological distress symptoms.",
    };
  }

  if (/fire|smoke|flame|blaze|burning|explosion|extinguisher|alarm bell|fire alarm|chemical fire/i.test(text)) {
    return {
      type: "Fire / Smoke",
      suggestedRole: "Fire Safety Responder",
      matchedKeywords: ["combustion/flame", "smoke hazard"],
      reason: "Classified as Fire / Smoke emergency based on thermal hazard indicators.",
    };
  }

  if (/gas|lpg|cylinder|methane|propane|gas leak|toxic fume|sulfur smell|suffocat|odor|smell of gas/i.test(text)) {
    return {
      type: "Gas Leak",
      suggestedRole: "Facilities Emergency Responder",
      matchedKeywords: ["gas leakage", "toxic vapor/odor"],
      reason: "Classified as Gas Leak emergency based on hazardous airborne substance.",
    };
  }

  if (/flood|pipe burst|water gush|submerged|overflowing|sewage spill|puddle rising|water leak|washroom overflow|water line|bathroom flooded|tap broken/i.test(text)) {
    return {
      type: "Flooding",
      suggestedRole: "Facilities Emergency Responder",
      matchedKeywords: ["hydraulic failure", "water volume accumulation"],
      reason: "Classified as Flooding emergency based on water escape severity.",
    };
  }

  if (/fight|weapon|assault|intruder|trespass|harass|threat|stalk|robbery|security|guard|violence|suspicious person|attack|theft|forced entry|bully/i.test(text)) {
    return {
      type: "Security / Safety",
      suggestedRole: "Security Response",
      matchedKeywords: ["physical security threat", "campus safety breach"],
      reason: "Classified as Security / Safety emergency based on interpersonal threat or unauthorized entry.",
    };
  }

  if (/shock|electroc|spark|short circuit|wire|breaker|high voltage|arcing|transformer|burning wire|burning plastic|outlet sparking|power cut|fuse|socket|switchboard/i.test(text)) {
    return {
      type: "Electrical Hazard",
      suggestedRole: "Facilities Emergency Responder",
      matchedKeywords: ["electrical arcing", "circuit fire risk"],
      reason: "Classified as Electrical Hazard based on electrical fault indicators.",
    };
  }

  return {
    type: "Other",
    suggestedRole: "Facilities Emergency Responder",
    matchedKeywords: ["general campus emergency"],
    reason: "Assigned to Campus Emergency Facilities Dispatch.",
  };
}
