import sys
import os
import pytest
from unittest.mock import patch, MagicMock

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from logica.orar_generator import OrarGenerator

@pytest.fixture
def generator_mocked():
    with patch("logica.orar_generator.mysql.connector.connect") as mock_connect:
        # Mock conexiune și cursor
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Returnăm generatorul cu baza de date mockuită
        generator = OrarGenerator()
        yield generator

        # Cleanup
        generator.inchide_conexiunea()

@pytest.fixture
def generator_mock():
    mock = OrarGenerator()
    mock.incarca_date = MagicMock()  # evită apeluri reale la DB
    mock.grupe = []
    mock.zile = ["Luni", "Marti", "Miercuri"]
    mock.intervale = ["08:00-10:00", "10:00-12:00", "12:00-14:00"]
    mock.mapare_grupe = {}
    mock.grupa_si_subgrupa = {}
    mock.criterii = mock.get_criterii_default()
    mock.genereaza_activitate = MagicMock(return_value="Programare (C) Prof GC01")
    return mock        

def test_initializare(generator_mocked):
    assert generator_mocked.zile == ["Luni", "Marti", "Miercuri", "Joi", "Vineri"]
    assert "08:00-10:00" in generator_mocked.intervale
    assert generator_mocked.nivel == "Licenta"
    assert generator_mocked.an == "I"
    assert generator_mocked.criterii is not None

def test_get_criterii_default():
    generator = OrarGenerator()
    default = generator.get_criterii_default()

    assert isinstance(default, dict)
    assert default["pauza_miercuri"] == "14:00-16:00"
    assert default["max_ore_zi"] == 8
    assert default["pauza_dupa_6"] is True
    assert default["ore_master"] == ["16:00-18:00", "18:00-20:00"]

def test_extrage_an_si_nivel(generator_mocked):
    rezultat = generator_mocked.extrage_an_si_nivel("LM2a")
    assert rezultat == ("Master", "II")


def test_actualizeaza_criterii(generator_mocked):
    form_data = {
        "pauza_miercuri": "14:00-16:00",
        "max_ore_zi": 8,
        "pauza_dupa_6": True,
        "ore_master": "16:00-20:00"
    }
    generator_mocked.actualizeaza_criterii(form_data)
    assert generator_mocked.pauza_miercuri == "14:00-16:00"
    assert generator_mocked.max_ore_zi == 8
    assert generator_mocked.pauza_dupa_6 is True
    assert generator_mocked.criterii["ore_master"] == ["16:00-20:00"]

def test_genereaza_orar_returneaza_dict(generator_mock):
    generator_mock.grupe = [{"denumire": "LI1a", "subgrupa": ""}]
    generator_mock.mapare_grupe = {"LI1a": ("Licenta", "I")}
    generator_mock.grupa_si_subgrupa = {"LI1a": {"grupa_baza": "LI1a", "subgrupa": ""}}
    generator_mock.genereaza_activitate.return_value = "Programare (C) - Prof - sala GC01"

    rezultat = generator_mock.genereaza_orar()

    assert isinstance(rezultat, dict)
    assert "LI1a" in rezultat
    assert "Luni" in rezultat["LI1a"]


def test_pauza_fortata_miercuri(generator_mock):
    generator_mock.grupe = [{"denumire": "LI1a", "subgrupa": ""}]
    generator_mock.mapare_grupe = {"LI1a": ("Licenta", "I")}
    generator_mock.grupa_si_subgrupa = {"LI1a": {"grupa_baza": "LI1a", "subgrupa": ""}}
    generator_mock.criterii["pauza_miercuri"] = "10:00-12:00"
    generator_mock.genereaza_activitate.return_value = "Programare (C) - Prof - sala GC01"

    rezultat = generator_mock.genereaza_orar()

    assert rezultat["LI1a"]["Miercuri"]["10:00-12:00"] == "Pauză forțată"


def test_maxim_noua_cursuri(generator_mock):
    generator_mock.grupe = [{"denumire": "LI1a", "subgrupa": ""}]
    generator_mock.mapare_grupe = {"LI1a": ("Licenta", "I")}
    generator_mock.grupa_si_subgrupa = {"LI1a": {"grupa_baza": "LI1a", "subgrupa": ""}}

    # Simulează cursuri cu denumiri diferite la fiecare apel
    def curs_diferit(*args, **kwargs):
        denumiri = ["Matematică", "Fizică", "Chimie", "Biologie", "Informatică", "Logică", "Etică", "Istorie", "Geografie", "Sport"]
        if curs_diferit.counter < len(denumiri):
            den = denumiri[curs_diferit.counter]
            curs_diferit.counter += 1
            return f"{den} (C) - Prof - sala GC01"
        return ""
    curs_diferit.counter = 0
    generator_mock.genereaza_activitate.side_effect = curs_diferit

    rezultat = generator_mock.genereaza_orar()

    total = sum(
        1 for zi in rezultat["LI1a"] for act in rezultat["LI1a"][zi].values()
        if "(C)" in act
    )
    assert total <= 9


