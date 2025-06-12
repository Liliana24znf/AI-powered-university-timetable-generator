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
        self.cursor = self.connection.cursor()

    def show_tables(self):
        self.cursor.execute("SHOW TABLES")
        return self.cursor.fetchall()

    def execute_query(self, query, params=None):
        self.cursor.execute(query, params or ())
        return self.cursor.fetchall()

    def insert_query(self, query, params=None):
        self.cursor.execute(query, params or ())
        self.connection.commit()

    def close(self):
        self.cursor.close()
        self.connection.close()


# Funcție simplă compatibilă cu rutele existente
def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="licenta",
        port=3306
    )
