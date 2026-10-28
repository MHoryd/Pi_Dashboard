from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from app.routers.sys_info import router

# Setup a test FastAPI app
app = FastAPI()
app.include_router(router)

client = TestClient(app)


@patch("anyio.open_file")
@patch("psutil.virtual_memory")
@patch("psutil.cpu_percent")
def test_current_temperature(mock_cpu_percent, mock_virtual_memory, mock_open_file):
    mock_cpu_percent.return_value = [12.5, 25.0]

    mock_mem = MagicMock()
    mock_mem.total = 8589934592  # 8 GB in bytes
    mock_mem.used = 4294967296  # 4 GB in bytes
    mock_mem.available = 4294967296  # 4 GB in bytes
    mock_virtual_memory.return_value = mock_mem

    mock_file = AsyncMock()
    mock_file.read.return_value = "55000\n"  # Represents 55.0°C

    mock_context_manager = MagicMock()
    mock_context_manager.__aenter__.return_value = mock_file
    mock_context_manager.__aexit__.return_value = None
    mock_open_file.return_value = mock_context_manager

    response = client.get("/base_info")

    assert response.status_code == 200
    data = response.json()

    assert data["current_temp"] == "55.0"
    assert data["cpu_usage"] == [12.5, 25.0]
    assert data["memory_usage"]["total_mb"] == 8192.0
    assert data["memory_usage"]["used_mb"] == 4096.0
    assert data["memory_usage"]["free_mb"] == 4096.0


@patch("httpx.AsyncClient")
def test_docker_info(mock_async_client_cls):
    mock_response = MagicMock()
    mock_response.json.return_value = [
        {
            "Names": ["/my_test_container"],
            "State": "running",
            "Status": "Up 2 hours",
        }
    ]
    mock_response.raise_for_status.return_value = None

    mock_async_client = AsyncMock()
    mock_async_client.get.return_value = mock_response

    mock_async_client_cls.return_value.__aenter__.return_value = mock_async_client

    response = client.get("/docker_info")

    assert response.status_code == 200
    data = response.json()

    assert len(data) == 1
    assert data[0]["container_state"] == "running"
    assert data[0]["container_status"] == "Up 2 hours"
