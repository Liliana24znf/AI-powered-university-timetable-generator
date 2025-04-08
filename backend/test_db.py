from db_connection import Database  # asigură-te că fișierul clasei tale se numește db_connection.py

db = Database()

# Test 1: Afișează toate tabelele
print("Tabelele din baza de date:")
tabele = db.show_tables()
for t in tabele:
    print(t[0])

# Test 2: Execută un SELECT simplu (dacă ai un tabel numit 'profesori')
try:
    rezultate = db.execute_query("SELECT * FROM profesori")
    for row in rezultate:
        print(row)
except Exception as e:
    print("Eroare la SELECT:", e)

# Test 3: Inserare (doar dacă vrei să inserezi ceva rapid pentru test)
# db.insert_query("INSERT INTO profesori (nume, disciplina) VALUES (%s, %s)", ("Ionescu Maria", "Programare"))

db.close()
