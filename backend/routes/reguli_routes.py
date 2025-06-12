from flask import Blueprint, request, jsonify
from db_connection import get_connection

reguli_bp = Blueprint('reguli', __name__)

@reguli_bp.route("/salveaza_reguli", methods=["POST"])
def salveaza_reguli():
    data = request.get_json()
    reguli_text = data.get("reguli", "")
    denumire = data.get("denumire", "Fără denumire")

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO reguli (denumire, continut, data_adaugare) VALUES (%s, %s, NOW())",
            (denumire, reguli_text)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@reguli_bp.route("/ultimele_reguli", methods=["GET"])
def ultimele_reguli():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, denumire, continut, data_adaugare FROM reguli ORDER BY data_adaugare DESC ")
        reguli = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(reguli)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500




@reguli_bp.route("/actualizeaza_regula", methods=["PUT"])
def actualizeaza_regula():
    data = request.get_json()
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE reguli SET denumire = %s, continut = %s, data_adaugare = NOW() WHERE id = %s",
            (data["denumire"], data["reguli"], data["id"])
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@reguli_bp.route("/sterge_regula", methods=["DELETE"])
def sterge_regula():
    data = request.get_json()
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM reguli WHERE id = %s", (data["id"],))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500




# @reguli_bp.route("/regula/<int:id>", methods=["GET"])
# def get_regula_by_id(id):
#     try:
#         conn = get_connection()
#         cursor = conn.cursor(dictionary=True)
#         cursor.execute("SELECT * FROM reguli WHERE id = %s", (id,))
#         regula = cursor.fetchone()
#         cursor.close()
#         conn.close()
#         return jsonify(regula if regula else {"error": "Nu s-a găsit regula"})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
