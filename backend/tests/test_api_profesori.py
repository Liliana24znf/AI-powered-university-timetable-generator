import sys
import os
import json
import pytest

# Adăugăm calea spre backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from database.db_connection import get_connection


from routes.profesori_routes import profesori_bp

# Asigură-te că blueprint-ul este înregistrat corect
app.register_blueprint(profesori_bp)


@pytest.fixture
def client():
    app.testing = True
    with app.test_client() as client:
        yield client


def test_adauga_si_sterge_profesor(client):
    payload = {
        "nume": "Test Profesor API",
        "disponibilitate": {"luni": ["08:00-10:00"]},
        "discipline": [
            {"denumire": "Programare", "nivel": "Licență", "tipuri": ["Curs", "Seminar"]}
        ]
    }

    # Adăugare profesor
    response = client.post("/adauga_profesor", json=payload)
    assert response.status_code == 200
    assert response.get_json()["success"] is True

    # Găsire profesor în listă
    response = client.get("/toti_profesorii")
    profesori = response.get_json()
    profesor = next((p for p in profesori if p["nume"] == "Test Profesor API"), None)
    assert profesor is not None
    profesor_id = profesor["id"]

    # Ștergere profesor
    response = client.delete(f"/sterge_profesor/{profesor_id}")
    assert response.status_code == 200
    assert response.get_json()["success"] is True


def test_actualizeaza_profesor(client):
    # Creare profesor direct în DB
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO profesori (nume, disponibilitate) VALUES (%s, %s)",
        ("Profesor Actualizat", json.dumps({"marti": ["10:00-12:00"]}))
    )
    profesor_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO discipline_profesori (profesor_id, denumire, nivel, tip) VALUES (%s, %s, %s, %s)",
        (profesor_id, "BD", "Licență", "Seminar")
    )
    conn.commit()
    cursor.close()
    conn.close()

    # Actualizare prin API
    payload = {
        "nume": "Profesor Modificat",
        "disponibilitate": {"miercuri": ["14:00-16:00"]},
        "discipline": [
            {"denumire": "AI", "nivel": "Master", "tipuri": ["Curs"]}
        ]
    }

    response = client.put(f"/actualizeaza_profesor/{profesor_id}", json=payload)
    assert response.status_code == 200
    assert response.get_json()["success"] is True

    # Verificare modificare
    response = client.get("/toti_profesorii")
    profesori = response.get_json()
    prof = next((p for p in profesori if p["id"] == profesor_id), None)
    assert prof is not None
    assert prof["nume"] == "Profesor Modificat"
    assert any(d["denumire"] == "AI" for d in prof["discipline"])

    # Cleanup
    client.delete(f"/sterge_profesor/{profesor_id}")
