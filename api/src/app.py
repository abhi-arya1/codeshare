import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, WebSocketException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from src.managers import ConnectionManager, APIManager
from src.datatypes import *
from uuid import uuid4

app = FastAPI()
app.status = "OFFLINE"

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    """
    Startup Event for the FastAPI Application
    """
    app.ws_manager = ConnectionManager()
    app.msg_queue  = asyncio.Queue()
    app.classes = dict()
    app.status = "ONLINE"

    print("Started CodeShare API...")


@app.on_event("shutdown")
async def on_shutdown():
    """
    Shutdown Event for the FastAPI Application
    """
    app.status = "OFFLINE"
    print("Shutting down CodeShare API...")


@app.get('/')
async def home():
    return JSONResponse({
        "message": "Hello, World! Welcome to the CodeShare API",
        "status": app.status
    })


@app.post('/class/create', response_model=ClassResponse)
async def create_class(data: CreateClassRequest): 
    classId = str(uuid4()).replace('-', '')[:6]
    app.classes[classId] = {
        "password": data.password,
        "websockets": set(),
        "submissions": [],
        "problem": "",
        "common_code": "",
        "submissionState": "enabled"
    }
    return JSONResponse({
        "success": True,
        "class_id": classId
    })


@app.post('/class/reconnect', response_model=ClassResponse)
async def reconnect_to_class(data: ReconnectToClassRequest):
    if (data.password != app.classes.get(data.class_id, {"password": None}).get("password")):
        return JSONResponse({
            "success": False,
            "class_id": None
        })
    
    return JSONResponse({
        "success": True,
        "class_id": data.class_id
    })


@app.post('/class/close')
async def close_class(data: dict):
    if data["class_id"] in app.classes:
        del app.classes[data["class_id"]]
    return JSONResponse({
        "success": True
    })


@app.websocket("/ws/connect")
async def ws_connect(ws: WebSocket):
    await app.ws_manager.connect(ws)
    print("Connected a new WebSocket")
    try: 
        while True: 
            data = await ws.receive_json()
            print(data)

            classdata = app.classes.get(data["class_id"], None)
            if classdata is None: 
                await ws.send_json({
                    "type": "error",
                    "data": "404: Class Code Not Found"
                })
                return

            elif data["type"] == WebsocketDataType.INIT.value:
                app.classes[data["class_id"]]["websockets"].add(ws)
                await ws.send_json({
                    "type": "init",
                    "data": {
                        "submissions": classdata["submissions"],
                        "problem": classdata["problem"],
                        "code": classdata["common_code"],
                        "submissionState": classdata["submissionState"]
                    },
                    "class_id": data["class_id"]
                })

                # await publish_out_numstudents(classdata["websockets"], len(classdata["websockets"]), data["class_id"])

            elif data["type"] == WebsocketDataType.STUDENT_SUBMIT.value:
                app.classes[data["class_id"]]["submissions"].append(data["data"])
                await publish_out_submissions(classdata["websockets"], classdata["submissions"], data["class_id"])

            elif data["type"] == WebsocketDataType.TEACHER_SEND_PROBLEM.value:
                password = app.classes[data["class_id"]]["password"]
                if data["data"]["password"] != password:
                    await ws.send_json({
                        "type": "error",
                        "data": "401: Unauthorized"
                    })
                    return

                app.classes[data["class_id"]]["problem"] = data["data"]["description"]
                app.classes[data["class_id"]]["common_code"] = data["data"]["code"]
                await publish_out_problem(classdata["websockets"], classdata["problem"], classdata["common_code"], data["class_id"])

            elif data["type"] == WebsocketDataType.TEACHER_CLEAR_SUBMISSIONS.value:
                password = app.classes[data["class_id"]]["password"]
                if data["data"]["password"] != password:
                    await ws.send_json({
                        "type": "error",
                        "data": "401: Unauthorized"
                    })
                    return
                
                app.classes[data["class_id"]]["submissions"] = []
                await publish_out_submissions(classdata["websockets"], [], data["class_id"])

            elif data["type"] == WebsocketDataType.SUBMISSION_SWITCH.value:
                password = app.classes[data["class_id"]]["password"]
                if data["data"]["password"] != password:
                    await ws.send_json({
                        "type": "error",
                        "data": "401: Unauthorized"
                    })
                    return
                
                current_state = app.classes[data["class_id"]]["submissionState"]
                if(current_state == "enabled"):
                    app.classes[data["class_id"]]["submissionState"] = "disabled"
                else:
                    app.classes[data["class_id"]]["submissionState"] = "enabled"
                await publish_out_substate(classdata["websockets"], app.classes[data["class_id"]]["submissionState"], data["class_id"])


    except WebSocketDisconnect:
        print("Disconnected")
    finally: 
        app.ws_manager.disconnect(ws)




async def publish_out_submissions(websockets, submissions, class_id):
    packet = {
        "type": "submissionList",
        "data": submissions,
        "class_id": class_id
    }
    for ws in websockets:
        try:
            await ws.send_json(packet)
        except RuntimeError as e:
            print(f"WebSocket already closed: {e}")
        except Exception as e:
            print(f"Error sending message: {e}")


async def publish_out_substate(websockets, state, class_id):
    packet = {
        "type": "submissionState",
        "data": state,
        "class_id": class_id
    }
    for ws in websockets:
        try:
            await ws.send_json(packet)
        except RuntimeError as e:
            print(f"WebSocket already closed: {e}")
        except Exception as e:
            print(f"Error sending message: {e}")


async def publish_out_problem(websockets, problem, code, class_id):
    packet = {
        "type": "problem",
        "data": {
            "problem": problem,
            "code": code
        },
        "class_id": class_id
    }
    for ws in websockets:
        try:
            await ws.send_json(packet)
        except RuntimeError as e:
            print(f"WebSocket already closed: {e}")
        except Exception as e:
            print(f"Error sending message: {e}")

async def publish_out_numstudents(websockets, num_students, class_id):
    packet = {
        "type": "numStudents",
        "data": num_students - 1,
        "class_id": class_id
    }
    for ws in websockets:
        try:
            await ws.send_json(packet)
        except RuntimeError as e:
            print(f"WebSocket already closed: {e}")
        except Exception as e:
            print(f"Error sending message: {e}")