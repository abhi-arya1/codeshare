from typing import List, Any, Literal, LiteralString
from fastapi import WebSocket, FastAPI
from pydantic import BaseModel
from src.datatypes import CodeLanguage, ClassType

###################################################
#### CLASSROOM MANAGER
###################################################

class ClassroomManager: 
    def __init__(self, 
        class_id: LiteralString,
        class_password: LiteralString,
        class_type: ClassType
    ): 
        self.class_id = class_id
        self._class_password = class_password
        self.class_type = class_type
        self.websockets = set()
        self.submission_state: Literal["enabled", "disabled"] = "enabled"

    def connect(self, websoc: WebSocket):
        self.websockets.add(websoc)

    def disconnect(self, websoc: WebSocket):
        self.websockets.remove(websoc)

    def get_num_students(self):
        return len(self.websockets)
    
    def authenticate(self, pwd: LiteralString):
        return pwd == self._class_password
    
    def swap_submission_state(self):
        if(self.submission_state == "enabled"):
            self.submission_state = "disabled"
        else:
            self.submission_state = "enabled"

    def _get_init_packet(self, data: dict):
        return {
            "type": "init",
            "data": data,
            "class_id": self.class_id
        }

    async def publish_out_submission_state(self, app: FastAPI):
        for ws in self.websockets:
            app.total_messages_sent += 1
            try:
                await ws.send_json({
                    "type": "submissionState",
                    "data": self.submission_state,
                    "class_id": self.class_id
                })
            except RuntimeError as e:
                print(f"WebSocket already closed: {e}")
            except Exception as e:
                print(f"Error sending message: {e}")

###################################################
#### CODESHARE MANAGER 
###################################################


class CodeshareManager(ClassroomManager): 
    def __init__(self, 
        class_id: LiteralString,
        class_password: LiteralString,
        class_type: ClassType
    ): 
        super().__init__(class_id, class_password, class_type)
        self.submissions = []
        self.problem = ""
        self.common_code = ""
        self.code_language: CodeLanguage = "cpp"

    def get_num_submissions(self):
        return len(self.submissions)
    
    def get_init_packet(self, app: FastAPI): 
        classdata = {
            "submissions": self.submissions,
            "problem": self.problem,
            "common_code": self.common_code,
            "submission_state": self.submission_state
        }
        app.total_messages_sent += 1
        return self._get_init_packet(classdata)
    
    async def publish_out_submissions(self, app: FastAPI):
        for ws in self.websockets:
            app.total_messages_sent += 1
            try:
                await ws.send_json({
                    "type": "submissionList",
                    "data": self.submissions,
                    "class_id": self.class_id
                })
            except RuntimeError as e:
                print(f"WebSocket already closed: {e}")
            except Exception as e:
                print(f"Error sending message: {e}")

    async def publish_out_problem(self, app: FastAPI):
        for ws in self.websockets:
            app.total_messages_sent += 1
            try:
                await ws.send_json({
                    "type": "problem",
                    "data": self.problem,
                    "class_id": self.class_id
                })
            except RuntimeError as e:
                print(f"WebSocket already closed: {e}")
            except Exception as e:
                print(f"Error sending message: {e}")

    async def publish_out_common_code(self, app: FastAPI):
        for ws in self.websockets:
            app.total_messages_sent += 1
            try:
                await ws.send_json({
                    "type": "commonCode",
                    "data": self.common_code,
                    "class_id": self.class_id
                })
            except RuntimeError as e:
                print(f"WebSocket already closed: {e}")
            except Exception as e:
                print(f"Error sending message: {e}")


###################################################
#### POLLSHARE MANAGER
###################################################

class PollshareManager(ClassroomManager):
    def __init__(self, 
        class_id: LiteralString,
        class_password: LiteralString,
        class_type: ClassType
    ): 
        super().__init__(class_id, class_password, class_type)
        self.poll_question = ""
        self.options = []
        self.submissions = { opt: 0 for opt in self.options }

    def get_num_votes(self):
        return sum(self.submissions.values())

    def get_poll_results(self):
        return self.submissions
    
    def set_poll(self, question: str, options: List[str]):
        self.poll_question = question
        self.options = options
        self.submissions = { opt: 0 for opt in self.options }
    
    def get_init_packet(self, app):
        classdata = {
            "submissions": self.submissions,
            "poll_question": self.poll_question,
            "options": self.options,
            "submission_state": self.submission_state
        }
        app.total_messages_sent += 1
        return self._get_init_packet(classdata)
    
    def add_submission(self, submission: str):
        self.submissions[submission] += 1
    
    async def publish_out_submissions(self, app: FastAPI):
        for ws in self.websockets:
            app.total_messages_sent += 1
            try:
                await ws.send_json({
                    "type": "submissionList",
                    "data": self.submissions,
                    "class_id": self.class_id
                })
            except RuntimeError as e:
                print(f"WebSocket already closed: {e}")
            except Exception as e:
                print(f"Error sending message: {e}")

    async def publish_out_poll(self, app: FastAPI):
        for ws in self.websockets:
            app.total_messages_sent += 1
            try:
                await ws.send_json({
                    "type": "poll",
                    "data": {
                        "poll_question": self.poll_question,
                        "options": self.options,
                        "submissions": self.submissions
                    },
                    "class_id": self.class_id
                })
            except RuntimeError as e:
                print(f"WebSocket already closed: {e}")
            except Exception as e:
                print(f"Error sending message: {e}")
