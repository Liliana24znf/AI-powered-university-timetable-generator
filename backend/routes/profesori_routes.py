from flask import Blueprint, request, jsonify
from db_connection import get_connection
import json

profesori_bp = Blueprint("profesori", __name__)


@profesori_bp.route("/adauga_profesor", methods=["POST"])
def adauga_profesor():
    data = request.json
    nume = data.get("nume", "").strip()
    disponibilitate = json.dumps(data.get("disponibilitate", {}))
    discipline = data.get("discipline", [])

    if not nume or not discipline:
        return jsonify({"success": False, "error": "Nume sau discipline lipsă"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Adăugare profesor
        cursor.execute(
            "INSERT INTO profesori (nume, disponibilitate) VALUES (%s, %s)",
            (nume, disponibilitate)
        )
        profesor_id = cursor.lastrowid

       # Cod în backend Flask pentru inserare
        for disciplina in discipline:
            denumire = disciplina["denumire"]
            nivel = disciplina["nivel"]
            tipuri = disciplina.get("tipuri", [])
            
            for tip in tipuri:
                cursor.execute(
                    "INSERT INTO discipline_profesori (profesor_id, denumire, nivel, tip) VALUES (%s, %s, %s, %s)",
                    (profesor_id, denumire, nivel, tip)
                )


        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@profesori_bp.route("/toti_profesorii", methods=["GET"])
def toti_profesorii():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Obține toți profesorii
        cursor.execute("SELECT * FROM profesori")
        profesori = cursor.fetchall()

        # Atașează disciplinele la fiecare profesor, grupate după denumire + nivel
        for prof in profesori:
            prof_id = prof["id"]
            cursor.execute(
                "SELECT denumire, nivel, tip FROM discipline_profesori WHERE profesor_id = %s",
                (prof_id,)
            )
            rows = cursor.fetchall()

            # Grupare discipline după denumire + nivel
            discipline_dict = {}
            for row in rows:
                key = (row["denumire"], row["nivel"])
                if key not in discipline_dict:
                    discipline_dict[key] = []
                discipline_dict[key].append(row["tip"])

            # Construiește lista finală
            prof["discipline"] = [
                {
                    "denumire": den,
                    "nivel": niv,
                    "tipuri": tipuri
                }
                for (den, niv), tipuri in discipline_dict.items()
            ]

        cursor.close()
        conn.close()
        return jsonify(profesori)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@profesori_bp.route("/sterge_profesor/<int:id>", methods=["DELETE"])
def sterge_profesor(id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM profesori WHERE id = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Profesor șters cu succes."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@profesori_bp.route("/actualizeaza_profesor/<int:id>", methods=["PUT"])
def actualizeaza_profesor(id):
    data = request.json
    nume = data.get("nume", "").strip()
    disponibilitate = json.dumps(data.get("disponibilitate", {}))
    discipline = data.get("discipline", [])

    if not nume or not discipline:
        return jsonify({"success": False, "error": "Date lipsă"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Update profesor
        cursor.execute(
            "UPDATE profesori SET nume = %s, disponibilitate = %s WHERE id = %s",
            (nume, disponibilitate, id)
        )

        # Șterge discipline vechi
        cursor.execute("DELETE FROM discipline_profesori WHERE profesor_id = %s", (id,))

        # Adaugă discipline noi
        for disciplina in discipline:
            denumire = disciplina["denumire"]
            nivel = disciplina["nivel"]
            tipuri = disciplina.get("tipuri", [])
            for tip in tipuri:
                cursor.execute("""
                    INSERT INTO discipline_profesori (profesor_id, denumire, nivel, tip)
                    VALUES (%s, %s, %s, %s)
                """, (id, denumire, nivel, tip))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

