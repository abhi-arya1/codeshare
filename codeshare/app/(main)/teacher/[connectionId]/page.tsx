"use client";

import { ModeToggle } from "@/components/mode-toggle";
import MonacoEditor from "@/components/monaco";
import SubmissionItem from "@/components/submission-item";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import { Submission } from "@/lib/dtypes";
import { generateShortUUID } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { Send, X } from "lucide-react";
import { useState } from "react";

export default function TeacherHome() {
  const classCode = generateShortUUID();

  const [description, setDescription] = useState<string>("");
  const [submissions, setSubmissions] = useState<Submission[]>([
    {
      code: "HI",
      id: "HI",
      submittedAt: "2021-10-10T12:00:00Z"
    },
    {
      code: "HI",
      id: "HI",
      submittedAt: "2021-10-10T12:00:00Z"
    },
    {
      code: "HI",
      id: "HI",
      submittedAt: "2021-10-10T12:00:00Z"
    },
    {
      code: "#include <iostream>\nusing namespace std;\nint main() {\n\tcout << \'H\' << endl;\n}\n",
      id: "HI",
      submittedAt: "2021-10-10T12:00:00Z"
    }
  ]);

  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup direction="horizontal" className="max-h-screen overflow-clip">
        {/* Left panel - Code Editor */}
        <ResizablePanel defaultSize={50} minSize={40}>
          <div className="flex flex-col gap-y-2 p-4">
            <MonacoEditor 
              language="cpp"
              code=""
              onCodeChange={(code) => console.log(code)}
            />
          </div>
          <div className="flex flex-row justify-end items-center gap-x-2 p-4">
            <span className="text-muted-foreground text-sm pr-3 border-r-2 border-white">Submissions Enabled</span>
            <span className="text-muted-foreground text-sm">Connected Students: 0</span>
            <Button variant="destructive" className="flex flex-row gap-x-2">
              Disable Submissions <X className="h-4 w-4" />
            </Button>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />

        {/* Right panel - Description and Submissions */}
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="h-full p-4 flex flex-col gap-4">
            <div className={cn("bg-muted rounded-lg p-4 break-words whitespace-break-spaces flex items-start flex-row gap-x-2", !description && "text-muted-foreground italic")}>
              <Textarea className="border-2 border-muted-foreground max-h-[250px]" placeholder="(Markdown supported) Provide problem details here..." />
              <button className="rounded-lg transition-colors dark:text-white text-black hover:bg-muted-foreground/40 bg-muted-foreground/20 p-2">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto">
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