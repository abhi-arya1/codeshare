import asyncio
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, WebSocketException, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from src.managers import CodeshareManager, PollshareManager
from src.datatypes import *
from uuid import uuid4
import psutil
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
    app.classes = dict()
    app.websockets = set()
    app.status = "ONLINE"
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
        "message": "Hello, World! Welcome to the CodeShare API! Go to the URL below to access the CodeShare App.",
        "url": "https://codeshare.opennote.me",
        "status": app.status
    })


@app.get("/docs")
async def get_documentation(username: str = Depends(get_current_username)):
    return get_swagger_ui_html(openapi_url="/openapi.json", title="Codeshare API")


@app.get("/openapi.json")
async def openapi(username: str = Depends(get_current_username)):
    return get_openapi(title = "Codeshare API", version="1.0.0", routes=app.routes)


@app.post('/class/create', response_model=ClassResponse)
async def create_class(data: CreateClassRequest): 
    class_id = str(uuid4()).replace('-', '')[:6]

    if data.class_type == "poll":
        app.classes[class_id] = PollshareManager(class_id, data.password, data.class_type)
    else: 
        app.classes[class_id] = CodeshareManager(class_id, data.password, data.class_type)
    
    return JSONResponse({
        "success": True,
        "class_id": class_id
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
    process = psutil.Process()
    memory_info = process.memory_info()
    cpu_usage = process.cpu_percent(interval=0.5)
    disk_usage = psutil.disk_usage('/')

    metrics = {
        "status": app.status,
        "active_classes": len(app.classes),
        "total_messages_received": f"{app.total_messages_received:,}",
        "total_messages_sent": f"{app.total_messages_sent:,}",
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



@app.websocket("/codeshare/connect")
async def ws_connect(ws: WebSocket):
    await ws.accept()
    app.websockets.add(ws)
    try: 
        while True: 
            data = await ws.receive_json()
            app.total_messages_received += 1

            class_mgr: CodeshareManager | None = app.classes.get(data["class_id"], None)
            if class_mgr is None: 
                await ws.send_json(ERROR_404)
                app.total_messages_sent += 1
                return
            
            else:
                match data["type"]:
                    case CodeshareDataType.PING.value:
                        await ws.send_json({"type": "pong"})
                        app.total_messages_sent += 1

                    case CodeshareDataType.INIT.value:
                        class_mgr.websockets.add(ws)
                        await ws.send_json(class_mgr.get_init_packet(app))

                    case CodeshareDataType.STUDENT_SUBMIT.value:
                        class_mgr.submissions.append(data["data"])
                        await class_mgr.publish_out_submissions(app)

                    case CodeshareDataType.TEACHER_SEND_PROBLEM.value:
                        if not class_mgr.authenticate(data["data"]["password"]):
                            await ws.send_json(ERROR_401)
                            return
                        
                        class_mgr.problem = data["data"]["description"]
                        class_mgr.common_code = data["data"]["code"]
                        await class_mgr.publish_out_problem(app)

                    case CodeshareDataType.TEACHER_CLEAR_SUBMISSIONS.value:
                        if not class_mgr.authenticate(data["data"]["password"]):
                            await ws.send_json(ERROR_401)
                            return
                
                        class_mgr.submissions = []
                        await class_mgr.publish_out_submissions(app)

                    case CodeshareDataType.SUBMISSION_SWITCH.value:
                        if not class_mgr.authenticate(data["data"]["password"]):
                            await ws.send_json(ERROR_401)
                            app.total_messages_sent += 1
                            return
                        
                        class_mgr.swap_submission_state()
                        await class_mgr.publish_out_submission_state(app)
    except WebSocketDisconnect:
        print("Disconnected")
    finally: 
        app.websockets.remove(ws)
        for _class in app.classes.values():
            if ws in _class.websockets:
                _class.websockets.remove(ws)
                break



@app.websocket("/pollshare/connect")
async def ws_connect(ws: WebSocket):
    await ws.accept()
    app.websockets.add(ws)
    print("Connected a new WebSocket to PollShare")
    try: 
        while True: 
            data = await ws.receive_json()
            app.total_messages_received += 1

            class_mgr: PollshareManager | None = app.classes.get(data["class_id"], None)
            if class_mgr is None: 
                await ws.send_json(ERROR_404)
                app.total_messages_sent += 1
                return
        
            else: 
                match data["type"]:
                    case PollshareDataType.PING.value:
                        await ws.send_json({
                            "type": "pong"
                        })
                        app.total_messages_sent += 1

                    case PollshareDataType.INIT.value:
                        class_mgr.websockets.add(ws)
                        await ws.send_json(class_mgr.get_init_packet(app))

                    case PollshareDataType.STUDENT_SUBMIT_POLL.value:
                        class_mgr.add_submission(data["data"])
                        await class_mgr.publish_out_submissions(app)

                    case PollshareDataType.TEACHER_SEND_POLL.value:
                        if not class_mgr.authenticate(data["data"]["password"]):
                            await ws.send_json(ERROR_401)
                            return

                        class_mgr.set_poll(data["data"]["poll_question"], data["data"]["options"])
                        await class_mgr.publish_out_poll(app)

                    case PollshareDataType.TEACHER_CLEAR_SUBMISSIONS.value:
                        if not class_mgr.authenticate(data["data"]["password"]):
                            await ws.send_json(ERROR_401)
                            return

                        class_mgr.submissions = []
                        await class_mgr.publish_out_submissions(app)

                    case PollshareDataType.SUBMISSION_SWITCH.value:
                        if not class_mgr.authenticate(data["data"]["password"]):
                            await ws.send_json(ERROR_401)
                            app.total_messages_sent += 1
                            return

                        class_mgr.swap_submission_state()
                        await class_mgr.publish_out_submission_state(app)
    except WebSocketDisconnect:
        print("Disconnected")
    finally: 
        app.websockets.remove(ws)
        for _class in app.classes.values():
            if ws in _class.websockets:
                _class.websockets.remove(ws)
                break

