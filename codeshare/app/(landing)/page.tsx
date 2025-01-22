"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClass, reconnectToClass } from "@/lib/api";
import { generateShortUUID } from "@/lib/helpers";
import { GithubIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Landing = () => {
    const [classCode, setClassCode] = useState<string>("");
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        localStorage.removeItem("teacher_pw");
    }, [])

    const handleSubmit = () => {
        if(classCode === "" || !classCode) {
            setError("Please enter a class code to continue");
            return;
        }
        
        return router.push("/class/" + classCode);
    }

    const [password, setPassword] = useState<string>("");
    const handleClassCreate = async () => {
        if(password === "" || !password) {
            setError("Please enter a password to continue");
            return;
        }

        localStorage.setItem("teacher_pw", password);
        const classData = await createClass(password);
        return router.push(`/teacher/${classData?.class_id}`);
    }

    // const handleClassReconnect = async () => {
    //     if(password === "" || !password) {
    //         setError("Please enter a password to continue");
    //         return;
    //     }
    //     if(classId === "" || !classId) {
    //         setError("Please enter a password to continue");
    //         return;
    //     }

    //     const classData = await reconnectToClass(classId, password);
    //     // localStorage.setItem("is_teacher", "true");
    //     // localStorage.setItem("teacher_class_id", classData?.class_id || "");

    //     return router.push(`/teacher/${classData?.class_id}`);
    // }

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center">
            <div className="absolute top-3 right-4 flex items-center flex-row gap-x-2">
                <Button className="dark:bg-[#1a1a1a] dark:text-white" variant="outline" size="icon"
                    onClick={() => window.open("https://github.com/abhi-arya1/codeshare", "_blank")}
                >
                    <img src="/ghd.png" className="h-[1.2rem] w-[1.2rem] block dark:hidden rotate-0 scale-100" />
                    <img src="/ghl.png" className="h-[1.2rem] w-[1.2rem] hidden dark:block rotate-0 scale-100" />
                    <span className="sr-only">Github URL</span>
                </Button>
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
                                Set a Instruction Password
                            </AlertDialogTitle>
                            <Input placeholder="Enter a teacher password" type="password" 
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

                    {/* <AlertDialog>
                        <AlertDialogTrigger className="w-full">
                            <Button className="w-full" variant="secondary" onClick={() => {}}>
                                Restore Class
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogTitle className="font-base">
                                Enter Your Class Password
                            </AlertDialogTitle>
                            <Input placeholder="Enter Class ID" type="text" 
                                value={classId}
                                onChange={(e) => setClassId(e.target.value.trim())}
                                onKeyDown={(event) => {
                                    if(event.key === "Enter") {
                                        handleClassReconnect();
                                    }
                                }}
                            />
                            <Input placeholder="Enter a password" type="password" 
                                onChange={(e) => setPassword(e.target.value.trim())}
                                onKeyDown={(event) => {
                                    if(event.key === "Enter") {
                                        handleClassReconnect();
                                    }
                                }}
                            />
                            <AlertDialogFooter>
                                <AlertDialogCancel>
                                    Close
                                </AlertDialogCancel>
                                <AlertDialogAction onClick={handleClassReconnect}>
                                    Reconnect
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog> */}
                </CardContent>
            </Card>
            <span className="text-destructive text-xs my-2">{error}</span>
        </div>
    )
}
 
export default Landing;