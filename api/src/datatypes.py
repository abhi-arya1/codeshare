from pydantic import BaseModel
from enum import Enum 

class WebsocketDataType(Enum): 
    STUDENT_SUBMIT="studentSubmit"
    TEACHER_SEND_PROBLEM="teacherSendProblem"
    TEACHER_CLEAR_SUBMISSIONS="teacherClearSubmissions"
    INIT="init"
    COMMON_CODE="commonCode"
    SUBMISSION_SWITCH="teacherSwitchSubmit"


class ClassesDict(BaseModel):
    class_id: str
    class_password: str

class CreateClassRequest(BaseModel): 
    password: str

class ReconnectToClassRequest(BaseModel): 
    class_id: str
    password: str


class ClassResponse(BaseModel): 
    success: bool
    class_id: str