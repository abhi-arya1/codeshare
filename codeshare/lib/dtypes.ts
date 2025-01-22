
type Submission = {
    code: string;
    id: string;
    submittedAt?: string;
}

type CreateClassReturn = {
    success: boolean;
    class_id: string;
}

export type {
    Submission,
    CreateClassReturn
}