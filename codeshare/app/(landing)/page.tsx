"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { generateShortUUID } from "@/lib/helpers";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Landing = () => {
    const [classCode, setClassCode] = useState<string>("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = () => {
        if(classCode === "" || !classCode) {
            setError("Please enter a class code to continue");
            return;
        }

        return router.push("/class/" + classCode);
    }

    const [password, setPassword] = useState<string>("");

    const handleClassCreate = () => {
        if(password === "" || !password) {
            setError("Please enter a password to continue");
            return;
        }

        return router.push(`/teacher/${generateShortUUID()}`);
    }

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center">
            <div className="absolute top-3 right-4">
                <ModeToggle />
            </div>
            <Card className="py-2 px-3 flex flex-col items-center gap-y-3">
                <CardTitle className="mt-4 mb-2 text-xl">
                    Welcome to CodeShare
                </CardTitle>
                <CardContent className="flex flex-col items-center gap-y-2">
                    <div className="flex flex-row gap-x-3">
                        <Input 
                            placeholder="Enter a class code" className="" 
                            onChange={(e) => setClassCode(e.target.value.trim())} 
                            onKeyDown={(event) => {
                                if(event.key === "Enter") {
                                    handleSubmit();
                                }
                            }}
                        />
                        <Button variant="secondary" onClick={handleSubmit}>
                            Join
                        </Button>
                    </div>
                    <span className="text-muted-foreground text-xs">or, for instructors</span>
                    {/* () => router.push(`/teacher/${generateShortUUID()}`) */}
                    <AlertDialog>
                        <AlertDialogTrigger className="w-full">
                            <Button className="w-full" variant="secondary" onClick={() => {}}>
                                Create New Class
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogTitle className="font-base">
                                Set a Teacher Password
                            </AlertDialogTitle>
                            <Input placeholder="Enter a password" type="password" 
                                onChange={(e) => setPassword(e.target.value.trim())}
                                onKeyDown={(event) => {
                                    if(event.key === "Enter") {
                                        handleClassCreate();
                                    }
                                }}
                            />
                            <AlertDialogFooter>
                                <AlertDialogCancel>
                                    Close
                                </AlertDialogCancel>
                                <AlertDialogAction onClick={handleClassCreate}>
                                    Submit
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                        <AlertDialogTrigger className="w-full">
                            <Button className="w-full" variant="secondary" onClick={() => {}}>
                                Restore Class
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogTitle className="font-base">
                                Enter Your Class Password
                            </AlertDialogTitle>
                            <Input placeholder="Enter a password" type="password" 
                                onChange={(e) => setPassword(e.target.value.trim())}
                                onKeyDown={(event) => {
                                    if(event.key === "Enter") {
                                        handleClassCreate();
                                    }
                                }}
                            />
                            <AlertDialogFooter>
                                <AlertDialogCancel>
                                    Close
                                </AlertDialogCancel>
                                <AlertDialogAction onClick={handleClassCreate}>
                                    Submit
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
            <span className="text-destructive text-xs my-2">{error}</span>
        </div>
    )
}
 
export default Landing;