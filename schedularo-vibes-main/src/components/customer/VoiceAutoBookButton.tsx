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
  const handleAutoBook = useCallback(async () => {
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

      console.log("🚀 Auto-booking request:", {
        appointment_type_id: appointmentTypeId,
        latitude,
        longitude,
      });

      const response = await fetch(`${API_BASE_URL}/auto-book/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          latitude, 
          longitude,
          appointment_type_id: appointmentTypeId
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          detail: "Auto booking failed",
        }));
        throw new Error(err.detail);
      }

      const data: AutoBookingResponse = await response.json();

      speak(`Appointment booked successfully at ${data.resource_name}`);

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

      if (isBookingIntent) {
        handleAutoBook();
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
