# routes/auth_routes.py
from flask import Blueprint, request, jsonify
from database.db_connection import get_connection
import bcrypt

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        print("[DEBUG] Date primite:", data)
        nume = data['nume']
        email = data['email']
        parola = data['parola']

        hashed = bcrypt.hashpw(parola.encode('utf-8'), bcrypt.gensalt())

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO utilizatori (nume, email, parola) VALUES (%s, %s, %s)", (nume, email, hashed))
        conn.commit()
        return jsonify({'status': 'success'}), 201
    except Exception as e:
        print("🔥 Eroare la înregistrare:", str(e))
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data['email']
    parola = data['parola']

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM utilizatori WHERE email=%s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user and bcrypt.checkpw(parola.encode('utf-8'), user['parola'].encode('utf-8')):
        # Eliminăm parola din răspuns pentru siguranță
        user.pop('parola', None)
        return jsonify({'status': 'success', 'user': user})
    else:
        return jsonify({'status': 'error', 'message': 'Date de autentificare incorecte'}), 401

