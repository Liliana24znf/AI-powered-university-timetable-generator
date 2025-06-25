import sys
import os
import json
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from database.db_connection import get_connection
from routes.orar_routes import orar_bp

if 'orar_bp' not in app.blueprints:
    app.register_blueprint(orar_bp)


@pytest.fixture
def client():
    app.testing = True
    with app.test_client() as client:
        yield client


def test_date_orar(client):
    response = client.get("/date_orar")
    assert response.status_code == 200
    data = response.get_json()
    assert "profesori" in data
    assert "sali" in data
    assert "grupe" in data
    assert "reguli" in data


def test_salveaza_si_sterge_orar(client):
    # payload minim valabil
    payload = {
        "nivel": "Licenta",
        "an": "Anul I",
        "orar": {
            "Licenta": {
                "LI1a": {
                    "Luni": {
                        "08:00-10:00": {
                            "activitate": "Programare",
                            "tip": "Curs",
                            "profesor": "Prof. Test",
                            "sala": "GC1"
                        }
                    }
                }
            }
        }
    }

    response = client.post("/salveaza_orar", json=payload)
    assert response.status_code == 200
    assert response.get_json()["success"] is True

    # obține orarele pentru a extrage ID-ul ultimului
    response = client.get("/orare_generate")
    assert response.status_code == 200
    orare = response.get_json()
    assert isinstance(orare, list) and len(orare) > 0
    orar_id = orare[0]["id"]  # cel mai recent

    # test GET by ID
    response = client.get(f"/orar_generat/{orar_id}")
    assert response.status_code == 200
    orar_json = response.get_json()
    assert "Licenta" in orar_json

    # test editare
    response = client.put(f"/editeaza_orar/{orar_id}", json={"nume": "Test Editat"})
    assert response.status_code == 200
    assert response.get_json()["success"] is True

    # test ștergere
    response = client.delete(f"/sterge_orar/{orar_id}")
    assert response.status_code == 200
    assert response.get_json()["success"] is True


def test_orare_generate(client):
    response = client.get("/orare_generate")
    assert response.status_code == 200
    lista = response.get_json()
    assert isinstance(lista, list)
