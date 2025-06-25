import sys
import os
import json
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from database.db_connection import get_connection
from routes.reguli_routes import reguli_bp

# Înregistrăm blueprint-ul dacă nu e deja
if 'reguli' not in app.blueprints:
    app.register_blueprint(reguli_bp)


@pytest.fixture
def client():
    app.testing = True
    with app.test_client() as client:
        yield client


def test_salveaza_si_sterge_regula(client):
    # Salvare regulă nouă
    payload = {
        "denumire": "Test Regula API",
        "reguli": '{"regula": "Continut test"}'
    }

    response = client.post("/salveaza_reguli", json=payload)
    assert response.status_code == 200
    assert response.get_json()["success"] is True

    # Verificare în lista de reguli
    response = client.get("/ultimele_reguli")
    assert response.status_code == 200
    reguli = response.get_json()
    regula = next((r for r in reguli if r["denumire"] == "Test Regula API"), None)
    assert regula is not None
    regula_id = regula["id"]

    # Ștergere regulă
    response = client.delete("/sterge_regula", json={"id": regula_id})
    assert response.status_code == 200
    assert response.get_json()["success"] is True


def test_actualizeaza_regula(client):
    # Inserare directă în DB
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO reguli (denumire, continut, data_adaugare) VALUES (%s, %s, NOW())",
        ("Regula de modificat", '{"init": "da"}')
    )
    regula_id = cursor.lastrowid
    conn.commit()
    cursor.close()
    conn.close()

    # Actualizare prin API
    payload = {
        "id": regula_id,
        "denumire": "Regula Modificata",
        "reguli": '{"modificat": true}'
    }

    response = client.put("/actualizeaza_regula", json=payload)
    assert response.status_code == 200
    assert response.get_json()["success"] is True

    # Verificare modificare
    response = client.get("/ultimele_reguli")
    reguli = response.get_json()
    regula = next((r for r in reguli if r["id"] == regula_id), None)
    assert regula is not None
    assert regula["denumire"] == "Regula Modificata"
    assert "modificat" in regula["continut"]

    # Cleanup
    client.delete("/sterge_regula", json={"id": regula_id})


def test_ultimele_reguli(client):
    response = client.get("/ultimele_reguli")
    assert response.status_code == 200
    reguli = response.get_json()
    assert isinstance(reguli, list)
