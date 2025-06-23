import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.db_connection import Database

def test_show_tables():
    db = Database()
    tabele = db.show_tables()
    db.close()
    
    # Extragem doar valorile (numele tabelelor)
    nume_tabele = [list(t.values())[0] for t in tabele]
    
    assert isinstance(tabele, list)
    assert "profesori" in nume_tabele, "Tabela 'profesori' nu a fost găsită"


def test_select_profesori():
    db = Database()
    rezultate = db.execute_query("SELECT * FROM profesori")
    db.close()
    assert isinstance(rezultate, list)
    if rezultate:
        assert "id" in rezultate[0], "Lipsesc coloane esențiale în răspuns"


def test_insert_and_delete_profesor():
    db = Database()

    # 1. Inserare profesor de test
    insert_query = """
        INSERT INTO profesori (nume, disponibilitate)
        VALUES (%s, %s)
    """
    test_nume = "Test Profesor Pytest"
    test_disponibilitate = '{"Luni": ["08:00-10:00"]}'
    db.insert_query(insert_query, (test_nume, test_disponibilitate))

    # 2. Verificare existență
    select_query = "SELECT * FROM profesori WHERE nume = %s"
    rezultate = db.execute_query(select_query, (test_nume,))
    assert len(rezultate) == 1, "Profesorul nu a fost inserat corect"

    # 3. Ștergere
    delete_query = "DELETE FROM profesori WHERE nume = %s"
    db.insert_query(delete_query, (test_nume,))

    # 4. Verificare ștergere
    rezultate_post = db.execute_query(select_query, (test_nume,))
    assert len(rezultate_post) == 0, "Profesorul nu a fost șters după test"

    db.close()
