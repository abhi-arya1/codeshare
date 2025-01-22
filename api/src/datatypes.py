from pydantic import BaseModel

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