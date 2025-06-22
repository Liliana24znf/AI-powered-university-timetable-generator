from flask import Blueprint, request, jsonify
from database.db_connection import get_connection
import mysql.connector

grupe_bp = Blueprint("grupe", __name__)

@grupe_bp.route("/adauga_grupe", methods=["POST"])
def adauga_grupe():
    grupe = request.get_json()
    try:
        conn = get_connection()
        cursor = conn.cursor()
        for grupa in grupe:
            cursor.execute("""
                INSERT INTO grupe (nivel, an, grupa, subgrupa, denumire)
                VALUES (%s, %s, %s, %s, %s)
            """, (grupa["nivel"], grupa["an"], grupa["grupa"], grupa["subgrupa"], grupa["denumire"]))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Grupe adăugate cu succes."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@grupe_bp.route("/toate_grupe", methods=["GET"])
def toate_grupe():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM grupe")
        grupe = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(grupe)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@grupe_bp.route("/sterge_grupe_selectate", methods=["POST"])
def sterge_grupe_selectate():
    data = request.get_json()
    coduri = data.get("coduri", [])
    if not coduri:
        return jsonify({"success": False, "error": "Lista de coduri este goală."}), 400
    try:
        conn = get_connection()
        cursor = conn.cursor()
        format_strings = ','.join(['%s'] * len(coduri))
        query = f"DELETE FROM grupe WHERE denumire IN ({format_strings})"
        cursor.execute(query, coduri)
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Grupele selectate au fost șterse."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@grupe_bp.route("/actualizeaza_grupa", methods=["PUT"])
def actualizeaza_grupa():
    data = request.get_json()
    cod_vechi = data.get("cod_vechi")
    cod_nou = data.get("cod_nou")
    if not cod_vechi or not cod_nou:
        return jsonify({"error": "Date lipsă"}), 400
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE grupe SET denumire = %s WHERE denumire = %s", (cod_nou, cod_vechi))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)})
