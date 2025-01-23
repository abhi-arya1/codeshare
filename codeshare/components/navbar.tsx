"use client";


import { Button } from "@/components/ui/button"
import { ArrowLeft, CircleCheck, Copy } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import { useState } from "react";
import { closeClass } from "@/lib/api";


const Navbar = () => {
    const [copied, setCopied] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const classCode = pathname.split("/")[2];

    const handleCopy = () => {
        navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_SITE_URL}/class/${classCode}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(classCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    const handleCloseClass = async () => {
        await closeClass(classCode);
        localStorage.removeItem("teacher_pw");
        router.push("/");
    }

    return (
        <nav className="top-0 w-screen p-1 px-3 grid grid-cols-3 items-center border-b-2 border-muted dark:border-primary-foreground">
            {/* Left Section */}
            <div
                className="flex flex-row text-muted-foreground hover:text-foreground transition-all gap-x-2 items-center cursor-pointer"
                role="button"
                onClick={async () => {
                    if(pathname.split('/')[1] === 'teacher') {
                        await handleCloseClass();
                    }
                    router.push("/");
                }}
            >
                <ArrowLeft className="h-4 w-4" />
                {
                    pathname.split('/')[1] === 'teacher' ? (
                        <span>Close Class</span>
                    ) : (<span>Leave Class</span>)
                }
            </div>

            {/* Center Section */}
            <div className="flex flex-row justify-center items-center">
                <div className="flex items-center gap-x-2 bg-muted/30 px-3 py-1 rounded-md">
                    <span className="font-semibold">Class Code: {classCode}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCopyCode}
                    >
                        {codeCopied ? <CircleCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-row justify-end items-center gap-x-2">
                {/* <span className="text-muted-foreground font-semibold">Codeshare</span> */}
                <ModeToggle />
                {
                    pathname.split('/')[1] === 'teacher' ? (
                        <Button variant="secondary" onClick={handleCopy}>
                            { copied ? <><CircleCheck /> Copied Link</> : "Get Student Link" }
                        </Button>
                    ) : (null)
                }
            </div>
        </nav>

     );
}

export default Navbar;
