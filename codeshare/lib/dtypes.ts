
type Submission = {
    code: string;
    id: string;
    submittedAt?: string;
}

type CreateClassReturn = {
    success: boolean;
    class_id: string;
}

type WebSocketRecieve = {
    type: "submissionList" | "problem" | "init" | "numStudents" | "commonCode" | "submissionState" | "error";
    class_id: string;
    data: any;
}

type Poll = {
    question: string; 
    choices: string[];
}

export type {
    Submission,
    Poll,
    CreateClassReturn,
    WebSocketRecieve
}