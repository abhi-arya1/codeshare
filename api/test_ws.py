import asyncio
import websockets
import requests
import json

SERVER_URL = "ws://localhost:8080/ws/connect"
MAX_CONNECTIONS = 1000

async def connect_to_server(client_id, class_id, teacher=False):
    try:
        async with websockets.connect(SERVER_URL) as websocket:
            print(f"Client {client_id} connected")
            
            init_message = {
                "class_id": class_id,
                "type": "init"
            }
            await websocket.send(json.dumps(init_message))
            print(f"Client {client_id} sent init")
            
            if teacher:
                await asyncio.sleep(5)
                clear_message = {
                    "class_id": class_id,
                    "type": "teacher_clear_submissions",
                    "data": {"password": "test"}
                }
                await websocket.send(json.dumps(clear_message))
                print(f"Teacher cleared submissions.")

                update_message = {
                    "class_id": class_id,
                    "type": "teacher_send_problem",
                    "data": {
                        "description": "Solve x + y = z",
                        "code": "def solve(x, y): return x + y",
                        "password": "test"
                    }
                }
                await websocket.send(json.dumps(update_message))
                print(f"Teacher updated the problem.")

                toggle_message = {
                    "class_id": class_id,
                    "type": "submission_switch",
                    "data": {"password": "test"}
                }
                await websocket.send(json.dumps(toggle_message))
                print(f"Teacher toggled submission state.")
                return
            
            while True:
                try:
                    submission_message = {
                        "class_id": class_id,
                        "type": "student_submit",
                        "data": {
                            "client_id": client_id,
                            "solution": f"Submission from client {client_id}"
                        }
                    }
                    await websocket.send(json.dumps(submission_message))
                    print(f"Client {client_id} submitted a solution.")
                    
                    await asyncio.sleep(10)
                except websockets.ConnectionClosed:
                    print(f"Client {client_id} connection closed.")
                    break

    except Exception as e:
        print(f"Client {client_id} error: {e}")


async def main():
    """
    Manage up to MAX_CONNECTIONS simultaneous WebSocket connections.
    """
    res = requests.post("http://localhost:8080/class/create", json={"password": "test"})
    res.raise_for_status()
    data = res.json()
    class_id = data["class_id"]
    print(f"Class created: {class_id}")
    print(f"Connecting clients...press Ctrl+C to stop.")

    student_tasks = [
        connect_to_server(client_id, class_id) 
        for client_id in range(1, MAX_CONNECTIONS)
    ]

    teacher_task = connect_to_server(MAX_CONNECTIONS, class_id, teacher=True)

    await asyncio.gather(*student_tasks, teacher_task)
    print("All clients finished.")


if __name__ == "__main__":
    asyncio.run(main())
