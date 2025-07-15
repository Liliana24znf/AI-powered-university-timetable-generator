from flask import Blueprint, request, jsonify
from database.db_connection import get_connection

sali_bp = Blueprint("sali", __name__)


@sali_bp.route("/adauga_sali", methods=["POST"])
def adauga_sali():
    sali = request.get_json()
    try:
        conn = get_connection()
        cursor = conn.cursor()
        for sala in sali:
            cursor.execute(
                "INSERT INTO sali (cod, tip) VALUES (%s, %s)",
                (sala["cod"], sala["tip"])
            )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Săli adăugate cu succes."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@sali_bp.route("/sterge_sali", methods=["POST"])
def sterge_sali():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sali")
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Toate sălile au fost șterse."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@sali_bp.route('/sterge_sali_selectate', methods=['POST'])
def sterge_sali_selectate():
    data = request.get_json()
    coduri = data.get("coduri", [])

    if not coduri:
        return jsonify({"success": False, "error": "Lista de coduri este goală."}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()

        format_strings = ','.join(['%s'] * len(coduri))  # ex: %s, %s, %s
        query = f"DELETE FROM sali WHERE cod IN ({format_strings})"
        cursor.execute(query, coduri)

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": "Sălile selectate au fost șterse."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@sali_bp.route("/toate_sali", methods=["GET"])
def toate_sali():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM sali
            ORDER BY 
                tip,
                CAST(SUBSTRING(cod, 3) AS UNSIGNED)
        """)
        sali = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(sali)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

