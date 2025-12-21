import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Loader2 } from "lucide-react";

/* ============================
   Global runtime declarations
============================ */
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/* ============================
   Runtime Speech instance type
============================ */
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: any) => any) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: any) => any) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
}

/* ============================
   Types
============================ */
interface AutoBookingResponse {
  appointment_id: string;
  resource_name: string;
  start_time: string;
  end_time: string;
  message: string;
}

interface VoiceAutoBookButtonProps {
  className?: string;
  appointmentTypeId?: string;
}

/* ============================
   Config
============================ */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Demo-safe fallback (Mumbai)
const FALLBACK_LOCATION = {
  latitude: 19.0760,
  longitude: 72.8777,
};

/* ============================
   Helpers
============================ */
const getToken = (): string | null =>
  localStorage.getItem("auth_token");

const speak = (text: string) => {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }
};

function formatTimeForSpeak(hhmm: string) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map((s) => parseInt(s, 10));
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  if (m && m > 0) return `${hour12}:${m < 10 ? '0'+m : m} ${ampm}`;
  return `${hour12} ${ampm}`;
}

/* ============================
   Transcript parser (rule-based)
   - Returns preferred_date in YYYY-MM-DD
   - Returns preferred_time in HH:MM (24h)
   - No NLP, pure regex + mapping
============================ */
const monthMap: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function parseDateTimeFromTranscript(transcript: string): {
  preferred_date?: string;
  preferred_time?: string;
} {
  if (!transcript || !transcript.trim()) return {};

  const text = transcript.toLowerCase();
  const now = new Date();

  let preferred_date: string | undefined;
  let preferred_time: string | undefined;

  // Keywords: today / tomorrow
  if (text.includes("today")) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    preferred_date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } else if (text.includes("tomorrow")) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    preferred_date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // Date like "20th december" or "20 december" or "december 20"
  const dateRegex = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/i;
  const dateRegex2 = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i;

  const m1 = text.match(dateRegex);
  const m2 = text.match(dateRegex2);
  let dayNum: number | null = null;
  let monthNum: number | null = null;

  if (m1) {
    dayNum = parseInt(m1[1], 10);
    monthNum = monthMap[m1[2].toLowerCase()];
  } else if (m2) {
    dayNum = parseInt(m2[2], 10);
    monthNum = monthMap[m2[1].toLowerCase()];
  }

  if (dayNum && monthNum) {
    // construct date with current year, roll over to next year if in the past
    let year = now.getFullYear();
    const candidate = new Date(year, monthNum - 1, dayNum);
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (candidate < todayMid) {
      candidate.setFullYear(year + 1);
    }
    preferred_date = `${candidate.getFullYear()}-${pad(candidate.getMonth() + 1)}-${pad(candidate.getDate())}`;
  }

  // Time parsing: 3 pm, 3pm, 11 am, 5 -> assume hour
  // Match hour[:mm] optional am/pm
  const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const tm = text.match(timeRegex);
  if (tm) {
    let hour = parseInt(tm[1], 10);
    const minute = tm[2] ? parseInt(tm[2], 10) : 0;
    const ampm = tm[3] ? tm[3].toLowerCase() : null;

    if (ampm) {
      if (ampm === "pm" && hour < 12) hour += 12;
      if (ampm === "am" && hour === 12) hour = 0;
    }

    // If no am/pm and hour between 1-6, reasonable to assume PM? To be deterministic, assume user's hour as-is (24h not specified)
    // We'll keep the numeric hour and interpret as 24h when sending (e.g., "5" -> 05:00). This is deterministic.

    hour = Math.max(0, Math.min(23, hour));
    preferred_time = `${pad(hour)}:${pad(minute)}`;
  }

  const result: { preferred_date?: string; preferred_time?: string } = {};
  if (preferred_date) result.preferred_date = preferred_date;
  if (preferred_time) result.preferred_time = preferred_time;
  return result;
}

/* ============================
   Component
============================ */
const VoiceAutoBookButton = ({ className, appointmentTypeId }: VoiceAutoBookButtonProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] =
    useState<SpeechRecognitionInstance | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  /* ============================
     Geolocation (NEVER FAILS)
  ============================ */
  const getCurrentLocation = useCallback((): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(FALLBACK_LOCATION);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        (error) => {
          console.warn("📍 Location failed, using fallback", error);
          speak(
            "Location unavailable. Booking nearest available appointment."
          );
          resolve(FALLBACK_LOCATION);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  /* ============================
     Auto Booking
  ============================ */
  const handleAutoBook = useCallback(async (prefs?: { preferred_date?: string; preferred_time?: string }) => {
    setIsProcessing(true);
    setIsListening(false);

    try {
      if (!appointmentTypeId) {
        throw new Error("Appointment type not specified");
      }

      const token = getToken();
      if (!token) {
        throw new Error("Please login first");
      }

      const { latitude, longitude } = await getCurrentLocation();

      const payload: any = {
        latitude,
        longitude,
        appointment_type_id: appointmentTypeId,
      };
      if (prefs?.preferred_date) payload.preferred_date = prefs.preferred_date;
      if (prefs?.preferred_time) payload.preferred_time = prefs.preferred_time;

      console.log("🚀 Auto-booking request:", payload);

      const response = await fetch(`${API_BASE_URL}/auto-book/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          detail: "Auto booking failed",
        }));
        throw new Error(err.detail);
      }

      const data: AutoBookingResponse = await response.json();

      // Determine whether server booked exact preference or used fallback
      let verbal: string;
      const prefDate = prefs?.preferred_date;
      const prefTime = prefs?.preferred_time;

      const messageText = data.message || "";

      const matchedDate = prefDate ? messageText.includes(prefDate) : true;
      const matchedTime = prefTime ? data.start_time === prefTime : true;

      if (prefDate || prefTime) {
        if (matchedDate && matchedTime) {
          // Exact match
          verbal = `Your appointment has been booked on ${prefDate ? prefDate : ''}${prefDate && prefTime ? ' at ' : ''}${prefTime ? formatTimeForSpeak(prefTime) : ''}`.trim();
        } else {
          // Fallback
          verbal = `Exact time not available. Booked nearest available slot.`;
        }
      } else {
        verbal = `Appointment booked successfully at ${data.resource_name}`;
      }

      speak(verbal);

      toast({
        title: "Appointment booked",
        description: data.message,
      });

      setTimeout(() => {
        navigate("/customer/bookings");
      }, 2000);
    } catch (error: any) {
      console.error("❌ Auto booking error:", error);
      speak("Sorry, booking failed.");
      toast({
        title: "Booking failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [appointmentTypeId, navigate, toast, getCurrentLocation]);

  /* ============================
     Init Speech Recognition
  ============================ */
  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      console.warn("Speech recognition not supported");
      return;
    }

    const instance: SpeechRecognitionInstance =
      new SpeechRecognitionCtor();

    instance.continuous = false;
    instance.interimResults = false;
    instance.lang = "en-US";

    instance.onstart = () => setIsListening(true);

    instance.onresult = (event: any) => {
      const transcript =
        event.results?.[0]?.[0]?.transcript?.toLowerCase() || "";

      console.log("🎙 Speech transcript:", transcript);

      const keywords = ["book", "appointment", "schedule", "reserve"];
      const isBookingIntent = keywords.some((k) =>
        transcript.includes(k)
      );

      const prefs = parseDateTimeFromTranscript(transcript);

      if (isBookingIntent) {
        handleAutoBook(prefs);
      } else {
        speak("Please say book appointment");
        toast({
          title: "Command not recognized",
          description: "Try saying 'book appointment'",
          variant: "destructive",
        });
        setIsListening(false);
      }
    };

    instance.onerror = (event: any) => {
      console.error("Speech error:", event);
      setIsListening(false);
      toast({
        title: "Speech recognition error",
        description: event?.error || "Microphone error",
        variant: "destructive",
      });
    };

    instance.onend = () => setIsListening(false);

    setRecognition(instance);

    return () => {
      instance.stop();
    };
  }, [handleAutoBook, toast]);

  /* ============================
     Button click
  ============================ */
  const handleClick = () => {
    if (isProcessing) return;

    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    if (recognition) {
      recognition.start();
    } else {
      toast({
        title: "Speech not supported",
        description: "Please use Chrome or Edge browser",
        variant: "destructive",
      });
    }
  };

  /* ============================
     Render
  ============================ */
  return (
    <Button
      onClick={handleClick}
      disabled={isProcessing}
      variant="outline"
      className={className}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing…
        </>
      ) : isListening ? (
        <>
          <MicOff className="w-4 h-4 mr-2" />
          Stop Listening
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 mr-2" />
          🎙 Book by Voice
        </>
      )}
    </Button>
  );
};

export default VoiceAutoBookButton;
