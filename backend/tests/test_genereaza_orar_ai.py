import sys
import os
import pytest
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from routes.orar_routes import orar_bp

if 'orar_bp' not in app.blueprints:
    app.register_blueprint(orar_bp)


@pytest.fixture
def client():
    app.testing = True
    with app.test_client() as client:
        yield client


@pytest.mark.integration
def test_generare_orar_ai(client):
    payload = {
        "prompt": """
        Generează un orar pentru grupele LI1a și LI1b, Licență, Anul I. Folosește doar intervalele 08:00-10:00 până la 18:00-20:00, fără suprapuneri. Cursurile să fie comune, laboratoarele pe subgrupe. Miercuri 14:00-16:00 pauză.
        """,
        "regula_id": 1,
        "nivel_selectat": "Licenta",
        "grupe_selectate": ["LI1a", "LI1b"]
    }

    response = client.post("/genereaza_orar", json=payload)
    assert response.status_code == 200

    orar = response.get_json()
    assert "Licenta" in orar
    assert isinstance(orar["Licenta"], dict)

    for grupa, zile in orar["Licenta"].items():
        assert isinstance(zile, dict)
        for zi, intervale in zile.items():
            assert zi in ["Luni", "Marti", "Miercuri", "Joi", "Vineri"]
            for interval, activitate in intervale.items():
                assert isinstance(activitate, dict)
                assert "activitate" in activitate
                assert "tip" in activitate
                assert "profesor" in activitate
                assert "sala" in activitate
