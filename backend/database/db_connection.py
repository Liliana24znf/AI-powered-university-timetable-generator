import mysql.connector

class Database:
    def __init__(self):
        self.connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="licenta",
            port=3306
        )
        self.cursor = self.connection.cursor(dictionary=True)


    def show_tables(self):
        # Execută interogarea SHOW TABLES pentru a lista toate tabelele din baza de date
        self.cursor.execute("SHOW TABLES")
        return self.cursor.fetchall()

    def execute_query(self, query, params=None):
        # Execută o interogare SELECT (sau orice query care returnează rezultate)
        self.cursor.execute(query, params or ())
        return self.cursor.fetchall()

    def insert_query(self, query, params=None):
        # Execută o interogare de tip INSERT/UPDATE/DELETE și confirmă modificările
        self.cursor.execute(query, params or ())
        self.connection.commit()

    def close(self):
        # Închide cursorul și conexiunea la baza de date
        self.cursor.close()
        self.connection.close()


# Funcție simplă compatibilă cu rutele existente
# Utilă pentru a obține o conexiune rapidă în alte module, fără a folosi clasa Database
def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="licenta",
        port=3306
    )
