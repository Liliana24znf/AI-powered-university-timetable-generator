import re
from flask import Flask, render_template, jsonify, request
from openai import OpenAI
import json
from flask_cors import CORS
import mysql.connector
import os
from flask import Flask, render_template_string
from orar_generator import OrarGenerator
from orar_generator import OrarGenerator, genereaza_html, genereaza_formular_criterii




client = OpenAI(api_key="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")

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template("index.html")

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="licenta"
    )

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
    
        # ✅ Obține grupele înainte de a trimite promptul la GPT
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT denumire FROM grupe WHERE nivel = 'Licenta'")
    grupele_licenta = [g['denumire'] for g in cursor.fetchall()]

    cursor.execute("SELECT denumire FROM grupe WHERE nivel = 'Master'")
    grupele_master = [g['denumire'] for g in cursor.fetchall()]
    cursor.close()
    conn.close()

    prompt_grupe = (
        "Grupele pentru care trebuie să generezi orar:\n"
        f"Licenta: {', '.join(grupele_licenta)}\n"
        f"Master: {', '.join(grupele_master)}\n\n"
    )

    reguli = prompt_grupe + reguli

    response = client.chat.completions.create(
        model="gpt-4o",
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

        # Normalizează ghilimelele
        json_str = json_str.replace("“", "\"").replace("”", "\"").replace("‘", "'").replace("’", "'")

        # Elimină liniile care conțin "..."
        lines = json_str.splitlines()
        clean_lines = []
        for line in lines:
            line = re.sub(r'//.*', '', line)
            if "..." not in line and line.strip():
                clean_lines.append(line)
        json_str_cleaned = "\n".join(clean_lines)

        # Elimină virgule care preced închiderea obiectului sau array-ului
        json_str_cleaned = re.sub(r",\s*(\]|\})", r"\1", json_str_cleaned)

        orar_json = json.loads(json_str_cleaned)

        # Completează anii și zilele lipsă
        orar_json = completeaza_grupe_lipsa(orar_json)


        print(">>> Orar generat (parsare reușită) <<<")
        print(json.dumps(orar_json, indent=2, ensure_ascii=False))
        return jsonify(orar_json)

    except Exception as e:
        print("Eroare la parsare JSON:", e)
        print(">>> Răspuns complet GPT <<<")
        print(orar_raw)
        return jsonify({"error": "Orarul generat nu este într-un format JSON valid."}), 500

@app.route("/adauga_disciplina", methods=["POST"])
def adauga_disciplina():
    data = request.json
    nume = data.get("nume")
    tip = data.get("tip")
    nivel = data.get("nivel")
    an = data.get("an")
    semestru = data.get("semestru")

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO discipline (nume, tip, nivel, an, semestru) VALUES (%s, %s, %s, %s, %s)",
            (nume, tip, nivel, an, semestru)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Disciplina adăugată cu succes."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
@app.route("/toate_disciplina", methods=["GET"])
def toate_disciplina():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM discipline")
        discipline = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(discipline)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
@app.route("/sterge_disciplina", methods=["POST"])
def sterge_disciplina():
    data = request.json
    disciplina_id = data.get("id")

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM discipline WHERE id = %s", (disciplina_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Disciplina ștearsă cu succes."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/adauga_profesor", methods=["POST"])
def adauga_profesor():
    data = request.json
    nivel_list = data.get("niveluri") or data.get("nivel", [])  # 🛠 corect și flexibil
    nivel = ", ".join(nivel_list)
    tipuri = ", ".join(data.get("tipuri", []))
    discipline = ", ".join(data.get("discipline", []))

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO profesori (nume, nivel, tipuri, discipline) VALUES (%s, %s, %s, %s)",
            (data.get("nume"), nivel, tipuri, discipline)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Profesor adăugat cu succes."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/toti_profesorii", methods=["GET"])
def toti_profesorii():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM profesori")
        profesori = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(profesori)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    
@app.route("/sterge_profesor/<int:id>", methods=["DELETE"])
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

@app.route("/actualizeaza_profesor/<int:id>", methods=["PUT"])
def actualizeaza_profesor(id):
    data = request.get_json()
    nume = data.get("nume")
    nivel = ", ".join(data.get("niveluri", []))
    tipuri = ", ".join(data.get("tipuri", []))
    discipline = ", ".join(data.get("discipline", []))

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE profesori 
            SET nume = %s, nivel = %s, tipuri = %s, discipline = %s 
            WHERE id = %s
        """, (nume, nivel, tipuri, discipline, id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
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

@app.route('/sterge_sali_selectate', methods=['POST'])
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

@app.route("/toate_sali", methods=["GET"])
def toate_sali():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM sali")
        sali = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(sali)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    

@app.route("/adauga_grupe", methods=["POST"])
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

@app.route("/toate_grupe", methods=["GET"])
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

@app.route("/sterge_grupe_selectate", methods=["POST"])
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

def completeaza_grupe_lipsa(orar_json):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT nivel, denumire FROM grupe")
        toate_grupele = cursor.fetchall()
        cursor.close()
        conn.close()

        zile = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"]

        for grupa in toate_grupele:
            nivel = grupa["nivel"]
            denumire = grupa["denumire"]

            if nivel not in orar_json:
                orar_json[nivel] = {}

            if denumire not in orar_json[nivel]:
                orar_json[nivel][denumire] = {}

            for zi in zile:
                if zi not in orar_json[nivel][denumire]:
                    orar_json[nivel][denumire][zi] = {}

        return orar_json
    except Exception as e:
        print("Eroare la completarea grupelor lipsă:", e)
        return orar_json



@app.route("/date_orar", methods=["GET"])
def date_orar():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Profesori
        cursor.execute("SELECT * FROM profesori")
        profesori = cursor.fetchall()
        for p in profesori:
            p["niveluri"] = [x.strip() for x in p["nivel"].split(",")] if p["nivel"] else []
            p["tipuri"] = [x.strip() for x in p["tipuri"].split(",")] if p["tipuri"] else []
            p["discipline"] = [x.strip() for x in p["discipline"].split(",")] if p["discipline"] else []

        # Săli
        cursor.execute("SELECT * FROM sali")
        sali = cursor.fetchall()

        # Grupe
        cursor.execute("SELECT * FROM grupe")
        grupe = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            "profesori": profesori,
            "sali": sali,
            "grupe": grupe
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/genereaza_orar_propriu", methods=["GET", "POST"])
def genereaza_orar_propriu():
    generator = OrarGenerator()

    if request.method == "POST":
        generator.actualizeaza_criterii(request.form)

    orar = generator.genereaza_orar()
    formular = genereaza_formular_criterii(generator.criterii)
    html = genereaza_html(orar, generator.criterii, formular)

    generator.inchide_conexiunea()
    return render_template_string(html)



if __name__ == '__main__':
    app.run(debug=True)