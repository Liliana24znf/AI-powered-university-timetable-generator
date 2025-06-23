import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from logica.validare import ValidatorOrar

def test_validare_cursuri_sincronizate_identic():
    grupe = ["LI1a", "LI1b"]
    zile = ["Luni", "Marti"]
    intervale = ["08:00-10:00", "10:00-12:00"]

    orar = {
        "Licenta": {
            "LI1a": {
                "Luni": {
                    "08:00-10:00": {
                        "activitate": "BD",
                        "tip": "Curs",
                        "profesor": "Prof. X",
                        "sala": "GC01"
                    }
                }
            },
            "LI1b": {
                "Luni": {
                    "08:00-10:00": {
                        "activitate": "BD",
                        "tip": "Curs",
                        "profesor": "Prof. X",
                        "sala": "GC01"
                    }
                }
            }
        }
    }

    validator = ValidatorOrar("Licenta", grupe, zile, intervale)
    validator.valideaza_cursuri_sincronizate(orar)
    # Nu trebuie să apară erori în consolă

def test_validare_cursuri_sincronizate_incorect():
    grupe = ["LI1a", "LI1b"]
    zile = ["Luni", "Marti"]
    intervale = ["08:00-10:00", "10:00-12:00"]

    orar = {
        "Licenta": {
            "LI1a": {
                "Luni": {
                    "08:00-10:00": {
                        "activitate": "Algebra",
                        "tip": "Curs",
                        "profesor": "Prof. A",
                        "sala": "GC01"
                    }
                }
            },
            "LI1b": {
                "Marti": {
                    "08:00-10:00": {
                        "activitate": "Algebra",
                        "tip": "Curs",
                        "profesor": "Prof. A",
                        "sala": "GC01"
                    }
                }
            }
        }
    }

    validator = ValidatorOrar("Licenta", grupe, zile, intervale)
    validator.valideaza_cursuri_sincronizate(orar)
    # Așteptăm afișarea unei erori de sincronizare în stdout
