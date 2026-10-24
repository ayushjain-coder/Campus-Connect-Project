// Helper for Emergency audio and speech synthesis

let alarmInterval: any = null;
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays an urgent two-tone electronic alert chime
 */
export function playAlertChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.setValueAtTime(1174.66, now + 0.15); // D6
    osc1.frequency.setValueAtTime(880, now + 0.3);

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.5);
  } catch (err) {
    console.warn("Could not play alert chime:", err);
  }
}

/**
 * Speaks text using Web Speech API
 */
export function speakText(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel(); // cancel pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pick an English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith("en"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis error:", err);
  }
}

/**
 * Starts continuous emergency alerting (alarm chime + voice repeat every 7 seconds)
 */
export function startEmergencyAlarm(text: string): void {
  stopEmergencyAlarm();

  // Immediate first play
  playAlertChime();
  speakText(text);

  // Repeating alert until stopped
  alarmInterval = setInterval(() => {
    playAlertChime();
    setTimeout(() => {
      speakText(text);
    }, 400);
  }, 7000);
}

/**
 * Stops continuous emergency alarm immediately
 */
export function stopEmergencyAlarm(): void {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Checks if staff has voice alerts enabled (default true)
 */
export function isVoiceAlertsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem("cc_emergency_voice_enabled");
  return saved === null ? true : saved === "true";
}

/**
 * Sets staff voice alerts preference
 */
export function setVoiceAlertsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("cc_emergency_voice_enabled", enabled ? "true" : "false");
}
