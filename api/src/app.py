import asyncio
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, WebSocketException, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from src.managers import ConnectionManager, APIManager
from src.datatypes import *
from uuid import uuid4
import psutil
from time import time
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from secrets import compare_digest
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi

app = FastAPI(docs_url=None, redoc_url=None, openapi_url="/openapi.json")
app.status = "OFFLINE"
security = HTTPBasic()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_username(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = compare_digest(credentials.username, "admin")
    correct_password = compare_digest(credentials.password, "ics46")
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


@app.on_event("startup")
async def on_startup():
    """
    Startup Event for the FastAPI Application
    """
    app.ws_manager = ConnectionManager()
    app.msg_queue  = asyncio.Queue()
    app.classes = dict()
    app.status = "ONLINE"
    app.start_time = time()
    app.total_messages_received = 0
    app.total_messages_sent = 0

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


@app.get("/docs")
async def get_documentation(username: str = Depends(get_current_username)):
    return get_swagger_ui_html(openapi_url="/openapi.json", title="Codespace API")


@app.get("/openapi.json")
async def openapi(username: str = Depends(get_current_username)):
    return get_openapi(title = "Codespace API", version="0.1.0", routes=app.routes)


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


@app.get("/metrics")
async def metrics(username: str = Depends(get_current_username)):
    """
    Endpoint to monitor API resource usage in a human-readable format.
    """
    uptime = time() - app.start_time
    process = psutil.Process()
    memory_info = process.memory_info()
    cpu_usage = process.cpu_percent(interval=0.5)
    disk_usage = psutil.disk_usage('/')

    metrics = {
        "status": app.status,
        "active_classes": len(app.classes),
        "total_messages_received": f"{app.total_messages_received:,}",
        "total_messages_sent": f"{app.total_messages_sent:,}",
        "uptime_seconds": f"{uptime:.2f} seconds",
        "process_resource_usage": {
            "memory": {
                "resident_set_size": f"{memory_info.rss / (1024 ** 2):.2f} MB",
                "virtual_memory_size": f"{memory_info.vms / (1024 ** 2):.2f} MB",
                "percent": f"{(memory_info.rss / psutil.virtual_memory().total) * 100:.2f}%"
            },
            "cpu_usage_percent": f"{cpu_usage}%",
            "threads": process.num_threads(),
        },
        "system_resource_usage": {
            "cpu_usage_percent": f"{psutil.cpu_percent(interval=0.5)}%",
            "memory_usage": {
                "total": f"{psutil.virtual_memory().total / (1024 ** 3):.2f} GB",
                "used": f"{psutil.virtual_memory().used / (1024 ** 3):.2f} GB",
                "free": f"{psutil.virtual_memory().available / (1024 ** 3):.2f} GB",
                "percent": f"{psutil.virtual_memory().percent}%",
            },
            "disk_usage": {
                "total": f"{disk_usage.total / (1024 ** 3):.2f} GB",
                "used": f"{disk_usage.used / (1024 ** 3):.2f} GB",
                "free": f"{disk_usage.free / (1024 ** 3):.2f} GB",
                "percent": f"{disk_usage.percent}%",
            },
        }
    }
    return JSONResponse(metrics)




@app.websocket("/ws/connect")
async def ws_connect(ws: WebSocket):
    await app.ws_manager.connect(ws)
    print("Connected a new WebSocket")
    try: 
        while True: 
            data = await ws.receive_json()
            app.total_messages_received += 1

            classdata = app.classes.get(data["class_id"], None)
            if classdata is None: 
                await ws.send_json({
                    "type": "error",
                    "data": "404: Class Code Not Found"
                })
                app.total_messages_sent += 1
                return
            
            elif data["type"] == WebsocketDataType.PING.value:
                await ws.send_json({
                    "type": "pong"
                })
                app.total_messages_sent += 1

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
                app.total_messages_sent += 1

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
                    app.total_messages_sent += 1
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
        app.total_messages_sent += 1
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
        app.total_messages_sent += 1
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
        app.total_messages_sent += 1
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
        app.total_messages_sent += 1
        try:
            await ws.send_json(packet)
        except RuntimeError as e:
            print(f"WebSocket already closed: {e}")
        except Exception as e:
            print(f"Error sending message: {e}")