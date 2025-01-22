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



@app.get('/')
def home():
    return JSONResponse({
        "message": "Hello, World! Welcome to the BetterGitCodings API",
        "status": app.status
    })


@app.get('/test/class/{class_id}')
def test_class(class_id: str):
    return JSONResponse({
        "success": class_id in app.classes,
        "data": app.classes[class_id]
    })

@app.get('/getclasses')
def get_classes():
    return JSONResponse({
        "classes": app.classes
    })


@app.post('/class/create', response_model=ClassResponse)
def create_class(data: CreateClassRequest): 
    classId = str(uuid4()).replace('-', '')[:6]
    app.classes[classId] = {
        "password": data.password,
        "websockets": []
    }
    return JSONResponse({
        "success": True,
        "class_id": str(uuid4()).replace('-', '')[:6]
    })


@app.post('/class/reconnect', response_model=ClassResponse)
def create_class(data: ReconnectToClassRequest):
    if (data.password != app.classes.get(data.class_id, {"password": None}).get("password")):
        return JSONResponse({
            "success": False,
            "class_id": None
        })
    
    return JSONResponse({
        "success": True,
        "class_id": data.class_id
    })


@app.websocket("/ws/connect")
def ws_connect():
    return {"message": "Connected"}