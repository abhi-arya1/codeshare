import { Submission } from "@/lib/dtypes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import { useEffect, useState } from "react";

const SubmissionItem = ({ sub, language }: { sub: Submission, language: string }) => {
    const [copied, setCopied] = useState(false);
  
    useEffect(() => {
      Prism.highlightAll();
    }, [sub.code]);
  
    const handleCopy = () => {
      navigator.clipboard.writeText(sub.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
  
    return (
      <Card className="px-2 py-[0.5px] group dark:bg-[#1f1f1f] shadow-none w-full flex flex-col">
        <pre className="relative p-3 mt-1 overflow-x-auto bg-[#1a1a1a] rounded-md">
          <div className="absolute right-2 text-muted-foreground transition-opacity">
            {copied ? (
              <Check className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100" />
            ) : (
              <Copy
                className="h-4 w-4 hover:text-white opacity-0 group-hover:opacity-100 hover:cursor-pointer"
                onClick={handleCopy}
              />
            )}
          </div>
          <code className={`language-${language}`}>{sub.code}</code>
        </pre>
        <span className="text-muted-foreground text-xs pb-1 text-end flex w-full">
          {(() => {
            const timeDiff = Date.now() - new Date(sub.submittedAt || "").getTime();
            const seconds = Math.floor(timeDiff / 1000);
            if (seconds < 60) return `${seconds}s ago`;
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes}m ago`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h ago`;
            return `${Math.floor(hours / 24)}d ago`;
          })()}
        </span>
      </Card>
    );
  };
  
  export default SubmissionItem;
  