import anyio
import httpx
import psutil
from fastapi import APIRouter

router = APIRouter()


@router.get("/base_info", tags=["sys_info"])
async def current_temperature():
    # temperature
    async with await anyio.open_file("/sys/class/thermal/thermal_zone0/temp") as f:
        temperature_read = await f.read()
        temperature = str(float(temperature_read) / 1000).strip()
    memory = psutil.virtual_memory()
    cpu_usage = psutil.cpu_percent(interval=None, percpu=True)

    return {
        "current_temp": temperature,
        "cpu_usage": cpu_usage,
        "memory_usage": {
            "total_mb": round(memory.total / (1024 * 1024), 2),
            "used_mb": round(memory.used / (1024 * 1024), 2),
            "free_mb": round(memory.available / (1024 * 1024), 2),
        },
    }


@router.get("/docker_info", tags=["sys_info"])
async def docker_info():
    transport = httpx.AsyncHTTPTransport(uds="/var/run/docker.sock")
    async with httpx.AsyncClient(
        transport=transport, base_url="http://localhost"
    ) as client:
        local_response = await client.get("/containers/json", params={"all": 1})
        local_response.raise_for_status()
        response = local_response.json()
        return [
            {
                "container_name": container["Names"][0].lstrip("/"),
                "container_state": container["State"],
                "container_status": container["Status"],
            }
            for container in response
        ]
