import uvicorn
import os

debug_mode = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
print(f"Debug mode is {'on' if debug_mode else 'off'}")
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="info", reload=debug_mode)
