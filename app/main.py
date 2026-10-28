from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from .routers import sys_info

app = FastAPI()
BASE_DIR = Path(__file__).resolve().parent

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="StaticFiles")

app.include_router(sys_info.router)


@app.get("/", response_class=HTMLResponse)
def main():
    html_file = BASE_DIR / "templates" / "index.html"
    return html_file.read_text(encoding="utf-8")


@app.get("/health")
def health():
    return {"status": "healthy"}
