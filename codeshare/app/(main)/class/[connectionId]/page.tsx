"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useMediaQuery } from "usehooks-ts";
import { RefreshCw, Send, Wifi, WifiOff } from "lucide-react";
import MarkdownRenderer from "@/components/markdown";
import MonacoEditor from "@/components/monaco";
import SubmissionItem from "@/components/submission-item";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Submission, WebSocketRecieve } from "@/lib/dtypes";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export default function Home() {
  const pathname = usePathname();
  const classId = pathname.split("/")[2];
  const { toast } = useToast();

  const [description, setDescription] = useState<string>("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionState, setSubmissionState] = useState<"enabled" | "disabled">("enabled");
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [connectionState, setConnectionState] = useState<"CONNECTING" | "OPEN" | "CLOSED">("CONNECTING");

  const isMobile = useMediaQuery("(max-width: 768px)");
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback(
    (type: string, class_id: string, data: any) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      const message = { type, class_id, data };
      wsRef.current.send(JSON.stringify(message));
    },
    []
  );

  const handleReconnect = () => {
    wsRef.current?.close();
    connect();
  };

  const connect = useCallback(() => {
    setConnectionState("CONNECTING");
    toast({
      title: "Connecting to class...",
      description: "Please wait while we establish connection",
    });

    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_API_URL_WS!}/ws/connect`);

    ws.onopen = () => {
      setConnectionState("OPEN");
      toast({
        title: "Connected to class",
        description: "You're now connected to the classroom",
        className: "bg-green-50 dark:bg-green-900 border-green-200",
      });
    };

    ws.onclose = () => {
      setConnectionState("CLOSED");
      toast({
        variant: "destructive",
        title: "Disconnected from class",
        description: (
          <div className="flex flex-col gap-y-2">
            <span>Lost connection to the classroom</span>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleReconnect}
            >
              Reconnect <RefreshCw className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
      });
    };

    ws.onerror = () => {
      setConnectionState("CLOSED");
      toast({
        variant: "destructive",
        title: "Connection error",
        description: (
          <div className="flex flex-col gap-y-2">
            <span>Failed to connect to the classroom</span>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleReconnect}
            >
              Retry Connection <RefreshCw className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
      });
    };

    ws.onmessage = (event) => {
      try {
        const msg: WebSocketRecieve = JSON.parse(event.data);
        switch (msg.type) {
          case "submissionList":
            setSubmissions(msg.data);
            break;
          case "problem":
            setDescription(msg.data.problem);
            setCode(msg.data.code);
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
            toast({
              variant: "destructive",
              title: "Error",
              description: msg.data,
            });
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to process server message",
        });
      }
    };

    wsRef.current = ws;
  }, [toast]);

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

  const handleSubmitCode = () => {
    if (submissionState === "disabled") return;
    if (code.trim() === "") {
      setError("Please enter some code to submit");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some code to submit",
      });
      return;
    }
    sendMessage("studentSubmit", classId, {
      code,
      submittedAt: new Date().toISOString(),
      id: uuidv4(),
    });
  };

  return (
    <div className="h-screen w-full relative">
      <ResizablePanelGroup
        direction={isMobile ? "vertical" : "horizontal"}
        className="max-h-screen overflow-clip h-full"
      >
        <ResizablePanel defaultSize={50} minSize={40}>
          <div className="flex flex-col gap-y-2 p-4 h-full">
            <MonacoEditor
              language="cpp"
              code={code}
              onCodeChange={(val) => setCode(val)}
              readOnly={submissionState === "disabled"}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="h-full p-4 flex flex-col gap-y-2">
            <div
              className={cn(
                "bg-muted rounded-lg p-4 break-words whitespace-break-spaces",
                !description && "text-muted-foreground italic"
              )}
            >
              {description ? (
                <MarkdownRenderer content={description} />
              ) : (
                "Awaiting problem..."
              )}
            </div>

            <div className="flex flex-row justify-end items-center gap-x-2 pt-2">
              {error && <span className="text-red-400 text-sm">{error}</span>}
              {submissionState === "enabled" ? (
                <Button variant="secondary" onClick={handleSubmitCode}>
                  Submit Code <Send className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <span className="text-muted-foreground text-sm italic mr-3">
                  Submissions are currently disabled. Please wait for your instructor.
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-scroll">
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

      <ToastProvider>
        <ToastViewport />
      </ToastProvider>
    </div>
  );
}
