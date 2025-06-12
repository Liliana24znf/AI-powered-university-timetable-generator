from db_connection import Database  # asigură-te că fișierul clasei tale se numește db_connection.py

db = Database()

# Test 1: Afișează toate tabelele
print("Tabelele din baza de date:")
tabele = db.show_tables()
for t in tabele:
    print(t[0])


try:
    rezultate = db.execute_query("SELECT * FROM profesori")
    for row in rezultate:
        print("Profesor: ", row)
except Exception as e:
    print("Eroare la SELECT:", e)


db.close()
