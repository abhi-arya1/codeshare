"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import MonacoEditor from "@/components/monaco";
import SubmissionItem from "@/components/submission-item";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import { Submission, WebSocketRecieve } from "@/lib/dtypes";
import { cn } from "@/lib/utils";
import { MessageSquareX, RefreshCw, Send, X, CircleX, CircleCheck, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MarkdownRenderer from "@/components/markdown";

export default function TeacherHome() {
  const pathname = usePathname();
  const classCode = pathname.split("/")[2];
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);

  const [description, setDescription] = useState<string>("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [submissionState, setSubmissionState] = useState<"enabled" | "disabled">("enabled");
  const [connectionState, setConnectionState] = useState<"CONNECTING" | "OPEN" | "CLOSED">("CONNECTING");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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

    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_API_URL_WS!}/ws/connect`);

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
        const msg: WebSocketRecieve = JSON.parse(event.data);

        switch (msg.type) {
          case "submissionList":
            setSubmissions(msg.data);
            break;
          case "init":
            setSubmissions(msg.data.submissions);
            setDescription(msg.data.problem);
            setCode(msg.data.code);
            setSubmissionState(msg.data.submissionState);
            break;
          case "submissionState":
            setSubmissionState(msg.data);
            break;
          case "error":
            setError(msg.data);
            break;
          default:
            break;
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

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleSendProblem = () => {
    sendMessage("teacherSendProblem", classCode, {
      description,
      code,
      password: localStorage.getItem("teacher_pw"),
    });
  };

  const handleDeleteProblem = () => {
    setDescription("");
    setCode("");
    sendMessage("teacherSendProblem", classCode, {
      description: "",
      code: "",
      password: localStorage.getItem("teacher_pw"),
    });
  };

  const handleClearSubmissions = () => {
    sendMessage("teacherClearSubmissions", classCode, {
      password: localStorage.getItem("teacher_pw"),
    });
  };

  const handleSwapSubmitState = () => {
    sendMessage("teacherSwitchSubmit", classCode, {
      password: localStorage.getItem("teacher_pw"),
    });
  };

  return (
    <div className="h-screen w-full relative">
      {/* Resize Layout */}
      <ResizablePanelGroup
        direction="horizontal"
        className="max-h-screen overflow-clip"
      >
        {/* Code Editor, Buttons */}
        <ResizablePanel defaultSize={50} minSize={40}>
          <div className="flex flex-col gap-y-2 p-4">
            <MonacoEditor
              language="cpp"
              code={code}
              onCodeChange={handleCodeChange}
              readOnly={false}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Description, Submissions */}
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="h-full p-4 flex flex-col gap-y-2">
            <div
              className={cn(
                "bg-muted rounded-lg p-4 break-words whitespace-break-spaces flex items-start flex-row gap-x-2",
                !description && "text-muted-foreground italic"
              )}
            >
              <Textarea
                className="border-2 border-muted-foreground min-h-[73px] resize-none"
                style={{
                  fontSize: "1rem",
                  height: "auto",
                  overflow: "hidden",
                }}
                placeholder="(Markdown supported) Provide problem details here..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  // auto-grow
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendProblem();
                  }
                }}
              />
              <div className="flex flex-col gap-y-2">
                <button
                  className="rounded-lg transition-colors dark:text-white text-black hover:bg-muted-foreground/40 bg-muted-foreground/20 p-2"
                  onClick={handleSendProblem}
                >
                  <Send className="h-4 w-4" />
                </button>
                <button
                  className="rounded-lg transition-colors dark:text-white text-black hover:bg-destructive/40 bg-destructive/20 p-2"
                  onClick={handleDeleteProblem}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-row justify-end items-center gap-x-2 pt-2">
              {error && <span className="text-red-400 text-sm">{error}</span>}

              <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="flex flex-row gap-x-2"
                >
                    View Current Question <Eye className="h-4 w-4" />
                </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Current Question</DialogTitle>
                </DialogHeader>
                <div className="mt-4 bg-muted p-4 rounded-lg">
                    {description ? (
                    <MarkdownRenderer content={description} />
                    ) : (
                    <span className="text-muted-foreground italic">No question set</span>
                    )}
                </div>
                </DialogContent>
            </Dialog>

              {submissionState === "enabled" ? (
                <Button
                  variant="destructive"
                  className="flex flex-row gap-x-2"
                  onClick={handleSwapSubmitState}
                >
                  Disable Submissions <CircleX className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="flex flex-row gap-x-2"
                  onClick={handleSwapSubmitState}
                >
                  Enable Submissions <CircleCheck className="h-4 w-4" />
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

            {/* Submissions List */}
            <div className="flex flex-col gap-2 overflow-y-auto">
              {submissions.length === 0 && (
                <span className="text-muted-foreground italic">
                  No submissions yet
                </span>
              )}
               {submissions
                .slice()
                .reverse()
                .map((sub, idx) => (
                  <SubmissionItem sub={sub} key={idx} language="cpp" />
                ))}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
