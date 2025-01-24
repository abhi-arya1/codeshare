"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import MarkdownRenderer from "@/components/markdown";

type PollSubmissions = Record<string, number>;

export default function Home() {
  const pathname = usePathname();
  const classId = pathname.split("/")[3] || "";

  const [pollQuestion, setPollQuestion] = useState<string>("");
  const [options, setOptions] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<PollSubmissions>({});
  const [submissionState, setSubmissionState] = useState<"enabled" | "disabled">("enabled");

  const [error, setError] = useState<string>("");
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<"CONNECTING" | "OPEN" | "CLOSED">(
    "CONNECTING"
  );

  const isMobile = useMediaQuery("(max-width: 768px)");
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((type: string, class_id: string, data: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const message = { type, class_id, data };
    wsRef.current.send(JSON.stringify(message));
  }, []);

  const connect = useCallback(() => {
    setConnectionState("CONNECTING");
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_API_URL_WS!}/pollshare/connect`);

    ws.onopen = () => {
      setConnectionState("OPEN");
    };
    ws.onclose = () => {
      setConnectionState("CLOSED");
    };
    ws.onerror = () => {
      setConnectionState("CLOSED");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "init": {
            const data = msg.data;
            setPollQuestion(data.poll_question || "");
            setOptions(data.options || []);
            setSubmissions(data.submissions || {});
            setSubmissionState(data.submission_state || "enabled");
            break;
          }
          case "poll": {
            setHasSubmitted(false);
            const data = msg.data;
            setPollQuestion(data.poll_question || "");
            setOptions(data.options || []);
            setSubmissions(data.submissions || {});
            break;
          }
          case "submissionList": {
            setSubmissions(msg.data || {});
            break;
          }
          case "submissionState": {
            setSubmissionState(msg.data);
            break;
          }
          case "error":
            setError(msg.data || "Unknown error from server.");
            break;

          case "pong":
            break;

          default:
            console.error("Unknown message type:", msg.type);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  useEffect(() => {
    if (connectionState === "OPEN") {
      sendMessage("init", classId, {});
    }
  }, [connectionState, classId, sendMessage]);

  const handleSubmitOption = (option: string) => {
    if (submissionState === "disabled") {
      setError("Submissions are currently disabled.");
      return;
    }
    setHasSubmitted(true);
    sendMessage("studentSubmitPoll", classId, option);
  };

  const handleReconnect = () => {
    wsRef.current?.close();
    connect();
  };

  return (
    <div className="h-screen w-full relative">
      <ResizablePanelGroup
        direction={isMobile ? "vertical" : "horizontal"}
        className="max-h-screen overflow-clip h-full"
      >
        {/* Left Panel / Results */}
        <ResizablePanel defaultSize={50} minSize={40}>
          <div className="flex flex-col gap-y-2 p-4 h-full">
            <h2 className="text-xl font-bold mb-2">Current Poll Submissions</h2>
            {Object.keys(submissions).length === 0 ? (
              <span className="text-muted-foreground italic">No votes yet</span>
            ) : (
              Object.entries(submissions).map(([opt, count]) => (
                <div
                  key={opt}
                  className="bg-muted p-2 rounded-lg flex justify-between items-center my-1"
                >
                  <span>{opt}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Poll question, possible choices, and a Submit button */}
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="h-full p-4 flex flex-col gap-y-2">

            {/* Poll question */}
            <div
              className={cn(
                "bg-muted rounded-lg p-4 break-words whitespace-break-spaces",
                !pollQuestion && "text-muted-foreground italic"
              )}
            >
              {pollQuestion ? (
                <MarkdownRenderer content={pollQuestion} />
              ) : (
                "Awaiting poll question..."
              )}
            </div>

            {/* If poll is present, show each option as a button or card */}
            <div className="flex flex-col gap-2 mt-2">
              {options.length === 0 ? (
                <span className="text-muted-foreground italic">
                  No answer choices yet
                </span>
              ) : (
                options.map((option, idx) => (
                  <Button
                    key={idx}
                    // Disable if teacher disabled submissions, or user has already submitted
                    disabled={submissionState === "disabled" || hasSubmitted}
                    onClick={() => handleSubmitOption(option)}
                  >
                    {option}
                  </Button>
                ))
              )}
            </div>

            {/* Display error if any */}
            {error && <span className="text-red-400 text-sm">{error}</span>}

            {/* Connection bar if not open */}
            {connectionState !== "OPEN" && (
              <div className="w-full bg-red-300 rounded-lg text-red-900 p-2 flex justify-between items-center z-10">
                <span>
                  {connectionState === "CONNECTING"
                    ? "Connecting to class..."
                    : "Disconnected from class. Please try reconnecting."}
                </span>
                {connectionState !== "CONNECTING" && (
                  <Button variant="destructive" onClick={handleReconnect}>
                    Reconnect <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
