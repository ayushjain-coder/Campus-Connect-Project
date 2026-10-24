import { EventEmitter } from "events";
import { EmergencyStreamEvent } from "./emergencyTypes";

// Ensure global singleton across hot reloads in Next.js development
declare global {
  // eslint-disable-next-line no-var
  var __campusconnect_emergency_bus__: EventEmitter | undefined;
}

const emergencyBus: EventEmitter =
  globalThis.__campusconnect_emergency_bus__ || new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalThis.__campusconnect_emergency_bus__ = emergencyBus;
}

// Support high listener counts for multiple open tabs
emergencyBus.setMaxListeners(100);

export function broadcastEmergencyEvent(event: EmergencyStreamEvent) {
  emergencyBus.emit("emergency_event", event);
}

export function subscribeToEmergencyEvents(
  callback: (event: EmergencyStreamEvent) => void
): () => void {
  emergencyBus.on("emergency_event", callback);
  return () => {
    emergencyBus.off("emergency_event", callback);
  };
}
