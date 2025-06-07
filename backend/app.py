import re
from flask import Flask, render_template, jsonify, request
from openai import OpenAI
import json
from flask_cors import CORS
import mysql.connector
import os
from flask import Flask, render_template_string
from orar_generator import OrarGenerator, genereaza_html, genereaza_formular_criterii, valideaza_orar

import bcrypt




client = OpenAI(api_key="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")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})



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



@app.route('/register', methods=['POST'])
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

@app.route('/login', methods=['POST'])
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


def completeaza_grupe_lipsa(orar_json, grupe_licenta=None, grupe_master=None):
    grupe_licenta = grupe_licenta or []
    grupe_master = grupe_master or []
    zile = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"]

    if "Licenta" not in orar_json:
        orar_json["Licenta"] = {}
    for grupa in grupe_licenta:
        if grupa not in orar_json["Licenta"]:
            orar_json["Licenta"][grupa] = {}
        for zi in zile:
            if zi not in orar_json["Licenta"][grupa]:
                orar_json["Licenta"][grupa][zi] = {}

    if "Master" not in orar_json:
        orar_json["Master"] = {}
    for grupa in grupe_master:
        if grupa not in orar_json["Master"]:
            orar_json["Master"][grupa] = {}
        for zi in zile:
            if zi not in orar_json["Master"][grupa]:
                orar_json["Master"][grupa][zi] = {}

    return orar_json


@app.route('/genereaza_orar', methods=['POST'])
def genereaza_orar():
    data = request.get_json()
    prompt_frontend = data.get("prompt")  # 👈 Preia promptul exact din frontend
    regula_id = data.get("regula_id")
    nivel_selectat = data.get("nivel_selectat")
    grupe_selectate = data.get("grupe_selectate", [])

    if not regula_id:
        return jsonify({"error": "ID-ul regulii nu a fost transmis."}), 400
    if not grupe_selectate:
        return jsonify({"error": "Nu au fost selectate grupele."}), 400
    if not prompt_frontend:
        return jsonify({"error": "Promptul final nu a fost transmis din frontend."}), 400

    try:
        # Trimite direct promptul complet la GPT
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "Răspunde DOAR cu JSON VALID, fără explicații. STRUCTURA OBLIGATORIE: { Licenta: { grupa: { zi: { interval: { activitate, tip, profesor, sala }}}}, Master: { ... } }. NU adăuga chei globale precum 'Luni', 'Marti' etc. Orarul trebuie să fie împărțit exclusiv pe grupe."
                },
                {
                    "role": "user",
                    "content": prompt_frontend  # 👈 promptFinal de la frontend
                }
            ]
        )

        orar_raw = response.choices[0].message.content.strip()

        # ✅ Parsare JSON
        start = orar_raw.find('{')
        end = orar_raw.rfind('}') + 1
        json_str = orar_raw[start:end]

        json_str = json_str.replace("“", "\"").replace("”", "\"").replace("‘", "'").replace("’", "'")
        lines = json_str.splitlines()
        clean_lines = [re.sub(r'//.*', '', line) for line in lines if "..." not in line and line.strip()]
        json_str_cleaned = re.sub(r",\s*([\]})])", r"\1", "\n".join(clean_lines))

        orar_json = json.loads(json_str_cleaned)

        # 🔁 Completează grupele lipsă
        orar_json = completeaza_grupe_lipsa(
            orar_json,
            grupe_licenta=grupe_selectate if nivel_selectat == "Licenta" else [],
            grupe_master=grupe_selectate if nivel_selectat == "Master" else []
        )

        print(">>> Orar generat <<<")
        print(json.dumps(orar_json, indent=2, ensure_ascii=False))
        return jsonify(orar_json)

    except Exception as e:
        print("Eroare la parsare JSON:", e)
        print(">>> Răspuns complet GPT <<<")
        print(orar_raw)
        return jsonify({"error": "Orarul generat nu este într-un format JSON valid."}), 500


@app.route("/adauga_profesor", methods=["POST"])
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


@app.route("/toti_profesorii", methods=["GET"])
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

@app.route("/sali_dupa_tip", methods=["GET"])
def sali_dupa_tip():
    tip = request.args.get("tip")
    if tip not in ['Curs', 'Laborator', 'Seminar','Proiect']:
        return jsonify({"success": False, "error": "Tip invalid"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM sali WHERE tip = %s", (tip,))
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


@app.route('/actualizeaza_grupa', methods=['PUT'])
def actualizeaza_grupa():
    data = request.get_json()
    cod_vechi = data.get("cod_vechi")
    cod_nou = data.get("cod_nou")

    if not cod_vechi or not cod_nou:
        return jsonify({"error": "Date lipsă"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE grupe SET denumire = %s WHERE denumire = %s", (cod_nou, cod_vechi))
        conn.commit()
        return jsonify({"success": True})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)})
    finally:
        cursor.close()
        conn.close()



@app.route("/salveaza_reguli", methods=["POST"])
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


@app.route("/ultimele_reguli", methods=["GET"])
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

@app.route("/regula/<int:id>", methods=["GET"])
def get_regula_by_id(id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM reguli WHERE id = %s", (id,))
        regula = cursor.fetchone()
        cursor.close()
        conn.close()
        return jsonify(regula if regula else {"error": "Nu s-a găsit regula"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/actualizeaza_regula", methods=["PUT"])
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


@app.route("/sterge_regula", methods=["DELETE"])
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


@app.route("/date_orar")
def date_orar():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM profesori")
    profesori = cursor.fetchall()

    cursor.execute("SELECT * FROM sali")
    sali = cursor.fetchall()

    cursor.execute("SELECT * FROM grupe")
    grupe = cursor.fetchall()

    cursor.execute("SELECT * FROM reguli ORDER BY id DESC LIMIT 1")
    regula = cursor.fetchone()

    cursor.execute("SELECT * FROM discipline_profesori")
    discipline = cursor.fetchall()

    return jsonify({
        "profesori": profesori,
        "sali": sali,
        "grupe": grupe,
        "reguli": regula,
        "discipline": discipline  # 🔥 asta lipsea în JSON
    })


@app.route("/genereaza_orar_propriu", methods=["GET", "POST"])
def genereaza_orar_propriu():
    print("🔁 S-a apelat ruta /genereaza_orar_propriu cu metoda:", request.method)

    # Inițializăm generatorul și setăm valorile implicite
    generator = OrarGenerator()
    nivel_selectat = "Licenta"
    an_selectat = "I"

    # Dacă formularul a fost trimis, actualizăm valorile
    if request.method == "POST":
        nivel_selectat = request.form.get("nivel", "Licenta")
        an_selectat = request.form.get("an", "I")
        generator.actualizeaza_criterii(request.form)

    # Generăm orarul complet pentru toate grupele
    orar_complet = generator.genereaza_orar()

    # Filtrăm doar grupele care corespund nivelului + anului selectat
    orar_filtrat = {}
    print(f"📌 Compar: nivel = {nivel_selectat}, an = {an_selectat}")
    for grupa, continut in orar_complet.items():
        nivel, an = generator.extrage_an_si_nivel(grupa)
        if nivel == nivel_selectat and an == an_selectat:
            orar_filtrat[grupa] = continut


    raport_validare = valideaza_orar(orar_filtrat)

    # Debug final în consolă
    print("✅ Orar filtrat pentru:", nivel_selectat, an_selectat)
    print(json.dumps(orar_filtrat, indent=2, ensure_ascii=False))

    # Generează HTML-ul pentru afișare
    formular = genereaza_formular_criterii(generator.criterii, nivel_selectat, an_selectat)
    html = genereaza_html(orar_filtrat, generator.criterii, formular) + raport_validare

    # Închidem conexiunea la DB
    generator.inchide_conexiunea()

    return render_template_string(html)

@app.route("/salveaza_orar", methods=["POST"])
def salveaza_orar():
    try:
        data = request.get_json()
        conn = get_connection()
        cursor = conn.cursor()

        # Salvează orarul în tabelă
        cursor.execute(
            "INSERT INTO orare_generate (nivel, an, continut_json) VALUES (%s, %s, %s)",
            (data["nivel"], data["an"], json.dumps(data["orar"]))
        )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": "Orar salvat cu succes."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/orare_generate", methods=["GET"])
def get_orare_generate():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id, nivel, an, data_creare, nume FROM orare_generate ORDER BY data_creare DESC")
        rezultate = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(rezultate)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/orar_generat/<int:orar_id>", methods=["GET"])
def get_orar_by_id(orar_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT continut_json FROM orare_generate WHERE id = %s", (orar_id,))
        rezultat = cursor.fetchone()

        cursor.close()
        conn.close()

        if rezultat and "continut_json" in rezultat:
            # Transformă stringul JSON în dict
            orar_json = json.loads(rezultat["continut_json"])
            return jsonify(orar_json)
        else:
            return jsonify({})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/sterge_orar/<int:orar_id>", methods=["DELETE"])
def sterge_orar(orar_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM orare_generate WHERE id = %s", (orar_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Orarul a fost șters."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/editeaza_orar/<int:id>", methods=["PUT"])
def editeaza_orar(id):
    data = request.get_json()
    nume_nou = data.get("nume")
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE orare_generate SET nume = %s WHERE id = %s", (nume_nou, id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)