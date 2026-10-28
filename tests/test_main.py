from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_app_is_healthy():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
