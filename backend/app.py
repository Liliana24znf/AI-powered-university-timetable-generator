from flask import Flask, render_template, jsonify, request
from openai import OpenAI
import json
from flask_cors import CORS
import os
import mysql.connector

client = OpenAI(api_key="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")

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template("index.html")

def completeaza_ani_lipsa(orar_json):
    nivele = {
        "Licenta": ["Anul I", "Anul II", "Anul III", "Anul IV"],
        "Master": ["Anul I", "Anul II"]
    }
    zile = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"]

    for nivel, ani in nivele.items():
        if nivel not in orar_json:
            orar_json[nivel] = {}
        for an in ani:
            if an not in orar_json[nivel]:
                orar_json[nivel][an] = {}
            for zi in zile:
                if zi not in orar_json[nivel][an]:
                    orar_json[nivel][an][zi] = {}
    return orar_json

@app.route('/genereaza_orar', methods=['POST'])
def genereaza_orar():
    data = request.get_json()
    reguli = data.get("reguli", "")

    if not reguli:
        return jsonify({"error": "Trebuie să furnizezi un set de reguli."}), 400

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Răspunde DOAR cu JSON valid. Fără explicații. Începe cu { și termină cu }."},
            {"role": "user", "content": reguli}
        ]
    )

    orar_raw = response.choices[0].message.content.strip()

    try:
        start = orar_raw.find('{')
        end = orar_raw.rfind('}') + 1
        json_str = orar_raw[start:end]
        json_str = json_str.replace("“", "\"").replace("”", "\"").replace("‘", "'").replace("’", "'")

        orar_json = json.loads(json_str)

        # Completează anii și zilele lipsă
        orar_json = completeaza_ani_lipsa(orar_json)

        print(">>> Orar generat (parsare reușită) <<<")
        print(json.dumps(orar_json, indent=2, ensure_ascii=False))
        return jsonify(orar_json)
    except Exception as e:
        print("Eroare la parsare JSON:", e)
        print(">>> Răspuns complet GPT <<<")
        print(orar_raw)
        return jsonify({"error": "Orarul generat nu este într-un format JSON valid."}), 500


# Conectare MySQL
def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="licenta"
    )

@app.route("/adauga_profesor", methods=["POST"])
def adauga_profesor():
    data = request.json
    nume = data.get("nume")
    nivel = data.get("nivel")
    tipuri = ", ".join(data.get("tipuri", []))  # Curs, Seminar etc.
    discipline = ", ".join(data.get("discipline", []))

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO profesori (nume, nivel, tipuri, discipline) VALUES (%s, %s, %s, %s)",
            (nume, nivel, tipuri, discipline)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Profesor adăugat cu succes."})
    except Exception as e:
        print("Eroare MySQL:", e)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/adauga_sali", methods=["POST"])
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
        print("Eroare MySQL:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    

@app.route("/sterge_sali", methods=["POST"])
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
    

@app.route("/toti_sali", methods=["GET"])
def toti_sali():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM sali")
        sali = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(sali)
    except Exception as e:
        print("Eroare MySQL:", e)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/toti_profesori", methods=["GET"])
def toti_profesori():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM profesori")
        profesori = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(profesori)
    except Exception as e:
        print("Eroare MySQL:", e)
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
