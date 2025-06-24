import sys
import os
import json
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from routes.generator_routes import generator_bp

# Înregistrăm blueprintul pentru generator (dacă nu a fost deja)
if 'generator_bp' not in app.blueprints:
    app.register_blueprint(generator_bp)




@pytest.fixture
def client():
    app.testing = True
    with app.test_client() as client:
        yield client


def test_get_genereaza_orar_propriu(client):
    response = client.get("/genereaza_orar_propriu")
    assert response.status_code == 200

    html = response.get_data(as_text=True)
    assert "<form" in html
    assert "Orar Generat Automat" in html


def test_post_genereaza_algoritm_propriu_valid(client):
    payload = {
        "nivel_selectat": "Licenta",
        "an_selectat": "I",
        "grupe_selectate": ["LI1a", "LI1b"]
    }

    response = client.post("/genereaza_algoritm_propriu", json=payload)
    assert response.status_code == 200

    data = response.get_json()
    assert "orar" in data
    assert isinstance(data["orar"], dict)


def test_post_genereaza_algoritm_propriu_invalid(client):
    # Trimitem payload incomplet, lipsesc nivel/an
    response = client.post("/genereaza_algoritm_propriu", json={})
    assert response.status_code == 400
    assert "error" in response.get_json()
