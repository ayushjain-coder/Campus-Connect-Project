import React, { useState, useEffect, useRef } from "react";
import { Send, Shield, User, Bot, AlertTriangle, CheckCircle2 } from "lucide-react";
import { EmergencyMessage, EmergencyStatus } from "@/lib/emergencyTypes";
import { useEmergencyStream } from "@/lib/useEmergencyStream";

interface EmergencyChatProps {
  emergencyId: string;
  currentUser: {
    id: string;
    name: string;
    role: "STUDENT" | "STAFF";
  };
  recipientName?: string;
  recipientRole?: string;
  incidentStatus: EmergencyStatus;
  authToken?: string | null;
}

export const EmergencyChat: React.FC<EmergencyChatProps> = ({
  emergencyId,
  currentUser,
  recipientName,
  recipientRole,
  incidentStatus,
  authToken,
}) => {
  const [messages, setMessages] = useState<EmergencyMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial messages
  useEffect(() => {
    let mounted = true;
    async function fetchMessages() {
      try {
        const headers: Record<string, string> = {};
        if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

        const res = await fetch(`/api/emergencies/${emergencyId}/messages`, {
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.messages) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        console.error("Failed to load emergency messages:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchMessages();
    return () => {
      mounted = false;
    };
  }, [emergencyId, authToken]);

  // Real-time message streaming
  useEmergencyStream((event) => {
    if (event.type === "message:created" && event.payload?.emergencyId === emergencyId) {
      const incoming: EmergencyMessage = event.payload.message;
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    }
  });

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setInputText("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      const res = await fetch(`/api/emergencies/${emergencyId}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: trimmed }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
      }
    } catch (err) {
      console.error("Failed to post message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const isResolved = incidentStatus === "RESOLVED" || incidentStatus === "CANCELLED";

  return (
    <div className="flex flex-col h-[420px] rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
      {/* Chat header */}
      <div className="px-4 py-3 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            🚨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Emergency Response Room
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-semibold border border-red-300 dark:border-red-800">
                {emergencyId}
              </span>
            </div>
            {recipientName && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Connected with: <strong className="text-slate-800 dark:text-slate-200">{recipientName}</strong>
                {recipientRole ? ` (${recipientRole})` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Secure</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            Connecting to emergency channel...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <p className="font-semibold">Emergency Channel Initialized</p>
            <p>Direct communication between student and responder.</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.senderRole === "SYSTEM") {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    <Shield className="w-3 h-3 text-red-500" />
                    <span>{msg.message}</span>
                  </div>
                </div>
              );
            }

            const isOwn =
              (currentUser.role === "STUDENT" && msg.senderRole === "STUDENT") ||
              (currentUser.role === "STAFF" && msg.senderRole === "STAFF");

            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {msg.senderName}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                      msg.senderRole === "STAFF"
                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                        : "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                    }`}
                  >
                    {msg.senderRole}
                  </span>
                  <span className="text-[10px] text-slate-400">{timeStr}</span>
                </div>

                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isOwn
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-tr-none"
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-tl-none"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isResolved || isSending}
          placeholder={
            isResolved
              ? "Emergency incident resolved. Communication archived."
              : "Type urgent update or instruction..."
          }
          className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending || isResolved}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
