"use client";

import MarkdownRenderer from "@/components/markdown";
import { ModeToggle } from "@/components/mode-toggle";
import MonacoEditor from "@/components/monaco";
import SubmissionItem from "@/components/submission-item";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Submission, WebSocketRecieve } from "@/lib/dtypes";
import { cn } from "@/lib/utils";
import webSocketService from "@/lib/ws_manager";
import { Send } from "lucide-react";
import Head from "next/head";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";


export default function Home() {
  const pathname = usePathname();
  const classId = pathname.split("/")[2];
  const router = useRouter();

  const [description, setDescription] = useState<string>("");
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [submissionState, setSubmissionState] = useState<"enabled" | "disabled">("enabled")
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    webSocketService.sendMessage("init", classId, {})
  }, []);

  webSocketService.onMessage((msg: WebSocketRecieve) => {
    if(msg.type === "submissionList") {
      setSubmissions(msg.data)
    } else if (msg.type === "problem") {
      setDescription(msg.data.problem)
      setCode(msg.data.code)
    } else if (msg.type === "init") {
      setSubmissions(msg.data.submissions)
      setDescription(msg.data.problem)
      setCode(msg.data.code)
      setSubmissionState(msg.data.submissionState)
    } else if (msg.type === "submissionState") {
      setSubmissionState(msg.data)
    } else if (msg.type === "error") {
      setError(msg.data);
    }
  })

  const handleSubmitCode = () => {
    if(submissionState === "disabled") return;
    if(code.trim() === "") {
      setError("Please enter some code to submit");
      return;
    }
    webSocketService.sendMessage("studentSubmit", classId, {
      code,
      submittedAt: new Date().toISOString(),
      id: uuidv4()
    })
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
              onCodeChange={(code) => setCode(code)}
              readOnly={submissionState === "disabled"}
            />
          </div>
          <div className="flex flex-row justify-end items-center gap-x-2 p-4">
            { 
              error && <span className="text-red-400 text-sm">{error}</span>
            }
            {
              submissionState === "enabled" ? (
                <Button variant="secondary" onClick={handleSubmitCode}>
                  Submit <Send className="h-4 w-4" />
                </Button>
              ) : (
                <span className="text-muted-foreground text-sm italic mr-3">Submissions are currently disabled. Please wait for your instructor.</span>
              )
            }
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />

        {/* Right panel - Description and Submissions */}
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="h-full p-4 flex flex-col gap-4">
            <div className={cn("bg-muted rounded-lg p-4 break-words whitespace-break-spaces", !description && "text-muted-foreground italic")}>
              {description ? <MarkdownRenderer content={description}/> : "Awaiting problem..."}
            </div>
            <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-scroll">
              { submissions.length === 0 && <span className="text-muted-foreground italic">No submissions yet</span> }
              {submissions.reverse().map((sub, idx) => (
                <SubmissionItem sub={sub} key={idx} language={"cpp"} />
              ))}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}