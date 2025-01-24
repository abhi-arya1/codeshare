from pydantic import BaseModel
from enum import Enum 
from typing import Literal

CodeLanguage = Literal["cpp", "python", "javascript"]
ClassType = Literal['poll', 'codeshare']

ERROR_404 = {
    "type": "error",
    "data": "404: Class Code Not Found"
}

ERROR_401 = {"type": "error", "data": "401: Unauthorized"}

class CodeshareDataType(Enum): 
    STUDENT_SUBMIT="studentSubmit"
    TEACHER_SEND_PROBLEM="teacherSendProblem"
    TEACHER_CLEAR_SUBMISSIONS="teacherClearSubmissions"
    INIT="init"
    COMMON_CODE="commonCode"
    SUBMISSION_SWITCH="teacherSwitchSubmit"
    PING="ping"


class PollshareDataType(Enum):
    TEACHER_SEND_POLL="teacherSendPoll"
    STUDENT_SUBMIT_POLL="studentSubmitPoll"
    TEACHER_CLEAR_SUBMISSIONS="teacherClearSubmissions"
    SUBMISSION_SWITCH="teacherSwitchSubmit"
    INIT="init"
    PING="ping"


class ClassesDict(BaseModel):
    class_id: str
    class_password: str

class CreateClassRequest(BaseModel): 
    password: str
    class_type: Literal["poll", "codespace"]

class ReconnectToClassRequest(BaseModel): 
    class_id: str
    password: str


class ClassResponse(BaseModel): 
    success: bool
    class_id: str
