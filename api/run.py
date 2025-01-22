import uvicorn


if __name__ == "__main__":
    uvicorn.run("src.app:app",
        host="127.0.0.1",
        port=8080
    )