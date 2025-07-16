import sys
import os
import pytest
from collections import defaultdict

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from logica.algoritm_clasic import AlgoritmClasic


@pytest.mark.integration
def test_algoritm_clasic_licenta_generare():
    algoritm = AlgoritmClasic(nivel="Licenta", an="I")
    orar = algoritm.genereaza()

    # Verificăm structura principală
    assert "Licenta" in orar
    assert isinstance(orar["Licenta"], dict)

    cel_putin_un_slot_populat = False

    for grupa, zile in orar["Licenta"].items():
        assert isinstance(zile, dict)
        for zi, intervale in zile.items():
            assert zi in ["Luni", "Marti", "Miercuri", "Joi", "Vineri"]
            for interval, activitate in intervale.items():
                if activitate:  # doar dacă activitate nu e dict gol
                    cel_putin_un_slot_populat = True
                    assert "activitate" in activitate
                    assert "tip" in activitate
                    assert "profesor" in activitate
                    assert "sala" in activitate

    assert cel_putin_un_slot_populat, "Niciun slot nu a fost populat cu activități"


@pytest.mark.integration
def test_algoritm_clasic_master_generare():
    algoritm = AlgoritmClasic(nivel="Master", an="I")
    orar = algoritm.genereaza()

    assert "Master" in orar
    assert isinstance(orar["Master"], dict)

    cel_putin_un_slot_populat = False

    for grupa, zile in orar["Master"].items():
        for zi, intervale in zile.items():
            for interval, activitate in intervale.items():
                if activitate:  # doar dacă e un slot populat
                    cel_putin_un_slot_populat = True
                    assert "activitate" in activitate
                    assert "tip" in activitate
                    assert "profesor" in activitate
                    assert "sala" in activitate

    assert cel_putin_un_slot_populat, "Niciun slot nu a fost populat cu activități"
