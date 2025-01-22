from typing import List, Any
from fastapi import WebSocket
from pydantic import BaseModel

class APIManager(BaseModel):
    """
    Serves the API for CodeShare
    """
    websocket: Any = None
    messages: List[str] = []

    class Config:
        """Pydantic Configuration Class for APIManager"""
        allow_mutation = True

    def __eq__(self, other: "APIManager") -> bool:
        """Check equality of two APIManager objects"""
        return self.websocket == other.websocket

    def run(self, data: Any) -> list:
        """
        Runs the CodeShare API with a given payload
        """
        return None
    


class ConnectionManager():
    """
    Manages WebSocket Connections for the Codeshare API
    """
    active_connections: List[WebSocket] = []
    ws_map: dict = {}

    def __str__(self):
        return str(self.active_connections)

    async def connect(self, websocket: WebSocket):
        """
        Adds a WebSocket Connection to the ConnectionManager
        """
        await websocket.accept()
        self.active_connections.append(websocket)
        self.ws_map[websocket] = APIManager(websocket=websocket)


    async def disconnect(self, websocket: WebSocket):
        """
        Removes a WebSocket Connection from the ConnectionManager
        """
        self.active_connections.remove(websocket)
        self.ws_map.pop(websocket, None)


    async def send_to_ws(self, _type: str, data: dict, websocket: WebSocket):
        """
        Sends a message to a specific WebSocket Connection
        """
        await websocket.send_json({
            "type": _type, 
            "data": data
        })


    async def broadcast(self, message: str):
        """
        Broadcasts a text message to all active WebSocket Connections
        """
        for connection in self.active_connections:
            await connection.send_text(message)