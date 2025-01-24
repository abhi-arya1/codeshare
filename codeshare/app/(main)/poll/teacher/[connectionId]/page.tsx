"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import { Poll } from "@/lib/dtypes";
import { cn } from "@/lib/utils";
import { MessageSquareX, PlusCircle, RefreshCw, Send, X } from "lucide-react";
import PollcardTeacher from "@/components/pollcard";


type PollSubmissions = Record<string, number>;

export default function TeacherHome() {
  const pathname = usePathname();
  const classCode = pathname.split("/")[3];
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);

  const [poll, setPoll] = useState<Poll>({
    question: "",
    choices: [],
  });

  const [submissions, setSubmissions] = useState<PollSubmissions>({});
  const [error, setError] = useState<string>("");
  const [currentChoice, setCurrentChoice] = useState<string>("");
  const [submissionState, setSubmissionState] = useState<"enabled" | "disabled">("enabled");
  const [connectionState, setConnectionState] = useState<"CONNECTING" | "OPEN" | "CLOSED">(
    "CONNECTING"
  );

  const sendMessage = useCallback(
    (type: string, class_id: string, data: any) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      const message = { type, class_id, data };
      wsRef.current.send(JSON.stringify(message));
    },
    []
  );

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
          case "submissionList":
            setSubmissions(msg.data);
            break;

          case "init":
            setSubmissions(msg.data.submissions || {});
            setPoll({
              question: msg.data.poll_question || "",
              choices: msg.data.options || [],
            });
            setSubmissionState(msg.data.submission_state || "enabled");
            break;

          case "poll":
            setPoll({
              question: msg.data.poll_question || "",
              choices: msg.data.options || [],
            });
            setSubmissions(msg.data.submissions || {});
            break;

          case "submissionState":
            setSubmissionState(msg.data);
            break;

          case "error":
            setError(msg.data);
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
      sendMessage("init", classCode, {});
    }
  }, [connectionState, classCode, sendMessage]);

  const handleReconnect = () => {
    wsRef.current?.close();
    connect();
  };

  useEffect(() => {
    const teacherPw = localStorage.getItem("teacher_pw");
    if (!teacherPw) {
      router.push("/");
    }
  }, [router]);

  const handleSendPoll = () => {
    const teacherPw = localStorage.getItem("teacher_pw");
    if (!teacherPw) {
      setError("Teacher password missing from localStorage.");
      return;
    }

    sendMessage("teacherSendPoll", classCode, {
      poll_question: poll.question,
      options: poll.choices,
      password: teacherPw,
    });
  };

  const handleAddChoice = () => {
    if (currentChoice.trim() === "") {
      setError("Please enter a valid choice.");
      return;
    }
    setPoll((prev) => ({
      ...prev,
      choices: [...prev.choices, currentChoice.trim()],
    }));
    setCurrentChoice("");
  };

  const handleDeleteChoice = (idx: number) => {
    setPoll((prev) => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== idx),
    }));
  };

  const handleClearSubmissions = () => {
    const teacherPw = localStorage.getItem("teacher_pw");
    if (!teacherPw) return;
    sendMessage("teacherClearSubmissions", classCode, {
      password: teacherPw,
    });
  };

  const handleSwapSubmitState = () => {
    const teacherPw = localStorage.getItem("teacher_pw");
    if (!teacherPw) return;
    sendMessage("teacherSwitchSubmit", classCode, {
      password: teacherPw,
    });
  };

  return (
    <div className="h-screen w-full relative">
      <ResizablePanelGroup direction="horizontal" className="max-h-screen overflow-clip">
        {/* Left Panel: Show submission results (the votes) */}
        <ResizablePanel defaultSize={50} minSize={40}>
          <div className="flex flex-col gap-y-2 p-4">
            <h2 className="text-xl font-bold mb-2">Poll Results</h2>
            <div className="flex flex-col gap-2 overflow-y-auto">
              {Object.keys(submissions).length === 0 && (
                <span className="text-muted-foreground italic">No submissions yet</span>
              )}
              {Object.entries(submissions)
                // Sort by highest number of votes if desired:
                .sort((a, b) => b[1] - a[1])
                .map(([option, count], idx) => (
                  <div
                    key={idx}
                    className="bg-muted p-2 rounded-lg flex flex-row justify-between items-center"
                  >
                    <span className="font-medium">
                      {option}
                    </span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Poll question, answer choices, controls */}
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="h-full p-4 flex flex-col gap-y-4">
            {/* Poll question */}
            <div
              className={cn(
                "bg-muted rounded-lg p-4 break-words whitespace-break-spaces flex items-start flex-row gap-x-2",
                !poll.question && "text-muted-foreground italic"
              )}
            >
              <Textarea
                className="border-2 border-muted-foreground min-h-[73px] resize-none"
                style={{
                  fontSize: "1rem",
                  height: "auto",
                  overflow: "hidden",
                }}
                placeholder="(Markdown supported) Provide your poll question..."
                value={poll.question}
                onChange={(e) => {
                  const val = e.target.value;
                  setPoll((prev) => ({ ...prev, question: val }));
                  // auto-grow
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  // If you want ENTER to send automatically, you can do it here
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPoll();
                  }
                }}
              />
              <div className="flex flex-col gap-y-2">
                {/* Send poll question + all choices */}
                <button
                  className="rounded-lg transition-colors dark:text-white text-black hover:bg-muted-foreground/40 bg-muted-foreground/20 p-2"
                  onClick={handleSendPoll}
                >
                  <Send className="h-4 w-4" /> Send to Students
                </button>
              </div>
            </div>

            {/* Single choice input */}
            <div
              className={cn(
                "bg-muted rounded-lg p-4 break-words whitespace-break-spaces flex items-start flex-row gap-x-2"
              )}
            >
              <Textarea
                className="border-2 border-muted-foreground min-h-[73px] resize-none"
                style={{
                  fontSize: "1rem",
                  height: "auto",
                  overflow: "hidden",
                }}
                placeholder="Add a new answer choice..."
                value={currentChoice}
                onChange={(e) => {
                  setCurrentChoice(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddChoice();
                  }
                }}
              />
              <div className="flex flex-col gap-y-2">
                <button
                  className="rounded-lg transition-colors dark:text-white text-black hover:bg-muted-foreground/40 bg-muted-foreground/20 p-2"
                  onClick={handleAddChoice}
                >
                  <PlusCircle className="h-4 w-4" /> Add Choice
                </button>
              </div>
            </div>

            {/* Submission State, Clear Submissions */}
            <div className="flex flex-row justify-end items-center gap-x-2 pt-2">
              {error && <span className="text-red-400 text-sm">{error}</span>}
              {submissionState === "enabled" ? (
                <Button
                  variant="destructive"
                  className="flex flex-row gap-x-2"
                  onClick={handleSwapSubmitState}
                >
                  Disable Submissions <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="flex flex-row gap-x-2"
                  onClick={handleSwapSubmitState}
                >
                  Enable Submissions <Send className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="destructive"
                className="flex flex-row gap-x-2"
                onClick={handleClearSubmissions}
              >
                Clear Responses <MessageSquareX className="h-4 w-4" />
              </Button>
            </div>

            {/* Connection bar if not OPEN */}
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

            {/* List of existing choices (PollcardTeacher) */}
            <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-y-3">
              {poll.choices.length > 0 ? (
                poll.choices.map((choice, idx) => (
                  <PollcardTeacher
                    key={idx}
                    content={choice}
                    idx={idx}
                    handleDeleteItem={() => handleDeleteChoice(idx)}
                  />
                ))
              ) : (
                <div className="bg-muted text-muted-foreground italic rounded-lg p-4">
                  Add answer choices here...
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
