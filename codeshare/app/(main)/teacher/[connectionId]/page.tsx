"use client";

import { ModeToggle } from "@/components/mode-toggle";
import MonacoEditor from "@/components/monaco";
import SubmissionItem from "@/components/submission-item";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import { Submission, WebSocketRecieve } from "@/lib/dtypes";
import { cn, debounce } from "@/lib/utils";
import { MessageSquareX, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import webSocketService from "@/lib/ws_manager";
import { usePathname, useRouter } from "next/navigation";

export default function TeacherHome() {
  const pathname = usePathname();
  const classCode = pathname.split("/")[2];
  const router = useRouter();

  const [description, setDescription] = useState<string>("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [submissionState, setSubmissionState] = useState<"enabled" | "disabled">("enabled");

  useEffect(() => {
    const teacherPw = localStorage.getItem("teacher_pw");
    if (!teacherPw) {
        router.push("/");
    }
  }, []);

  useEffect(() => {
    webSocketService.sendMessage("init", classCode, {})
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  }

  webSocketService.onMessage((msg: WebSocketRecieve) => {
    if(msg.type === "submissionList") {
      setSubmissions(msg.data)
    } else if (msg.type === "init") {
      setSubmissions(msg.data.submissions)
      setDescription(msg.data.problem)
      setCode(msg.data.code)
      setSubmissionState(msg.data.submissionState)
    } else if (msg.type === "submissionState") {
      setSubmissionState(msg.data)
    } else if (msg.type === "error") {
      setError(error);
    }
  })

  const handleSendProblem = () => {
    webSocketService.sendMessage("teacherSendProblem", classCode, {
      description,
      code,
      password: localStorage.getItem("teacher_pw")
    });
  }

  const handleDeleteProblem = () => {
    setDescription("");
    webSocketService.sendMessage("teacherSendProblem", classCode, {
      description: "",
      code: "",
      password: localStorage.getItem("teacher_pw")
    });
  }

  const handleClearSubmissions = () => {
    webSocketService.sendMessage("teacherClearSubmissions", classCode, {
      password: localStorage.getItem("teacher_pw")
    });
  }

  const handleSwapSubmitState = () => {
    webSocketService.sendMessage("teacherSwitchSubmit", classCode, {
      password: localStorage.getItem("teacher_pw")
    });
  }

  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup direction="horizontal" className="max-h-screen overflow-clip">
        {/* Left panel - Code Editor */}
        <ResizablePanel defaultSize={50} minSize={40}>
          <div className="flex flex-col gap-y-2 p-4">
            <MonacoEditor 
              language="cpp"
              code={code}
              onCodeChange={handleCodeChange}
              readOnly={false}
            />
          </div>
          <div className="flex flex-row justify-end items-center gap-x-2 p-4">
            {
              error && <span className="text-red-400 text-sm">{error}</span>
            }
            {
              submissionState === "enabled" ? (
                <Button variant="destructive" className="flex flex-row gap-x-2" onClick={handleSwapSubmitState}>
                  Disable Submissions <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button className="flex flex-row gap-x-2" onClick={handleSwapSubmitState}>
                  Enable Submissions <Send className="h-4 w-4" />
                </Button>
              )
            }
            <Button variant="destructive" className="flex flex-row gap-x-2" onClick={handleClearSubmissions}>
              Clear Responses <MessageSquareX className="h-4 w-4" />
            </Button>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />

        {/* Right panel - Description and Submissions */}
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="h-full p-4 flex flex-col gap-4">
            <div className={cn("bg-muted rounded-lg p-4 break-words whitespace-break-spaces flex items-start flex-row gap-x-2", !description && "text-muted-foreground italic")}>
              <Textarea 
                className="border-2 border-muted-foreground min-h-[73px] resize-none"
                style={{ 
                  fontSize: '1rem',
                  height: 'auto',
                  overflow: 'hidden'
                }}
                placeholder="(Markdown supported) Provide problem details here..." 
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  // Auto-grow functionality
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendProblem();
                  }
                }}
              />
              <div className="flex flex-col gap-y-2">
                <button className="rounded-lg transition-colors dark:text-white text-black hover:bg-muted-foreground/40 bg-muted-foreground/20 p-2"
                  onClick={handleSendProblem}
                >
                  <Send className="h-4 w-4" />
                </button>
                <button className="rounded-lg transition-colors dark:text-white text-black hover:bg-destructive/40 bg-destructive/20 p-2"
                  onClick={handleDeleteProblem}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto">
              { submissions.length === 0 && <span className="text-muted-foreground italic">No submissions yet</span> }
              {submissions.map((sub, idx) => (
                <SubmissionItem sub={sub} key={idx} language={"cpp"} />
              ))}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}