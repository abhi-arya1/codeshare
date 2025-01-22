import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, WebSocketException
from fastapi.responses import JSONResponse
from src.managers import ConnectionManager, APIManager

app = FastAPI()
app.status = "OFFLINE"

@app.on_event("startup")
async def on_startup():
    """
    Startup Event for the FastAPI Application
    """
    app.ws_manager = ConnectionManager()
    app.msg_queue  = asyncio.Queue()
    app.managers = {}
    app.status = "ONLINE"

    print("Started CodeShare API...")



@app.get('/')
def home():
    return JSONResponse({
        "message": "Hello, World! Welcome to the BetterGitCodings API",
        "status": app.status
    })

@app.websocket("/ws/connect")
def ws_connect(): 
    return {"message": "Connected"}