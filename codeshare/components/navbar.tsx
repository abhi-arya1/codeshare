"use client";


import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModeToggle } from "./mode-toggle";


const Navbar = () => {
    const router = useRouter();

    return (
        <nav className="top-0 w-screen p-1 px-3 grid grid-cols-3 items-center border-b-2 border-muted dark:border-primary-foreground">
            {/* Left Section */}
            <div
                className="flex flex-row text-muted-foreground hover:text-foreground transition-all gap-x-2 items-center cursor-pointer"
                role="button"
                onClick={() => router.push("/")}
            >
                <ArrowLeft className="h-4 w-4" />
                <span>Leave Class</span>
            </div>

            {/* Center Section */}
            <span className="flex flex-row justify-center font-semibold gap-x-2 items-center">
                
            </span>

            {/* Right Section */}
            <div className="flex flex-row justify-end items-center gap-x-2">
                <span className="text-muted-foreground font-semibold">Codeshare</span>
                <ModeToggle />
            </div>
        </nav>

     );
}

export default Navbar;
