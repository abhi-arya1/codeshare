"use client";


import { Button } from "@/components/ui/button"
import { ArrowLeft, CircleCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import { useState } from "react";
import { closeClass } from "@/lib/api";


const Navbar = () => {
    const [copied, setCopied] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const classCode = pathname.split("/")[3];
    const classType = pathname.split("/")[1];

    const handleCopy = () => {
        navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_SITE_URL}/${classType}/class/${classCode}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                    if(pathname.split('/')[2] === 'teacher') {
                        await handleCloseClass();
                    }
                    router.push("/");
                }}
            >
                <ArrowLeft className="h-4 w-4" />
                {
                    pathname.split('/')[2] === 'teacher' ? (
                        <span>Close Class</span>
                    ) : (<span>Leave Class</span>)
                }
            </div>

            {/* Center Section */}
            <span className="flex flex-row justify-center font-semibold gap-x-2 items-center">
                Class Code: {classCode}
            </span>

            {/* Right Section */}
            <div className="flex flex-row justify-end items-center gap-x-2">
                <span className="text-muted-foreground font-semibold">{
                    pathname.split('/')[1] === 'cs' ? "Codeshare" : "Pollshare"
                }</span>
                <ModeToggle />
                {
                    pathname.split('/')[2] === 'teacher' ? (
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
