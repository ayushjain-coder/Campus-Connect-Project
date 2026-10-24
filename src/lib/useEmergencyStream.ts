import { useEffect, useRef } from "react";
import { EmergencyStreamEvent } from "./emergencyTypes";

export function useEmergencyStream(
  onEvent: (event: EmergencyStreamEvent) => void,
  enabled: boolean = true
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let es: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      try {
        es = new EventSource("/api/emergencies/stream");

        es.onmessage = (e) => {
          if (!e.data || e.data.startsWith(":")) return;
          try {
            const parsed: EmergencyStreamEvent = JSON.parse(e.data);
            if (onEventRef.current) {
              onEventRef.current(parsed);
            }
          } catch (err) {
            console.error("Failed to parse SSE event:", err);
          }
        };

        es.onerror = () => {
          if (es) {
            es.close();
            es = null;
          }
          // Retry in 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        console.error("EventSource initialization error:", err);
        reconnectTimeout = setTimeout(connect, 4000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (es) {
        es.close();
      }
    };
  }, [enabled]);
}
