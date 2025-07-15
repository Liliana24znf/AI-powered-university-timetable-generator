from flask import Blueprint, request, jsonify
import json
import re
from openai import OpenAI
from database.db_connection import get_connection

orar_bp = Blueprint("orar_bp", __name__)
client = OpenAI(api_key="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")

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


@orar_bp.route('/genereaza_orar', methods=['POST'])
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
            ],
            temperature=0
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

@orar_bp.route("/date_orar")
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
        "discipline": discipline  
    })

@orar_bp.route("/salveaza_orar", methods=["POST"])
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

@orar_bp.route("/orare_generate", methods=["GET"])
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

@orar_bp.route("/orar_generat/<int:orar_id>", methods=["GET"])
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

@orar_bp.route("/sterge_orar/<int:orar_id>", methods=["DELETE"])
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

@orar_bp.route("/editeaza_orar/<int:id>", methods=["PUT"])
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