"use client";

import { ModeToggle } from "@/components/mode-toggle";
import MonacoEditor from "@/components/monaco";
import { Submission } from "@/lib/dtypes";
import { useState } from "react";

export default function Home() {
  const [submissions, setSubmissions] = useState<Submission[]>();

  return (
    <div className="h-full w-full flex flex-row gap-x-1">
      <div className="w-1/2">
        <MonacoEditor 
          language="cpp"
          code="cout << 'HI'"
          onCodeChange={(code) => console.log(code)}
        />
      </div>
      <div className="max-w-1/2 min-w-1/2 p-2">
        Hello
      </div>
    </div>
  );
}