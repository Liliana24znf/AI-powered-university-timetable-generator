# routes/generator_routes.py
import json
from flask import Blueprint, request, render_template_string, jsonify
from logica.orar_generator import OrarGenerator, genereaza_html, genereaza_formular_criterii, valideaza_orar
from logica.algoritm_clasic import AlgoritmClasic

generator_bp = Blueprint("generator_bp", __name__)

@generator_bp.route("/genereaza_orar_propriu", methods=["GET", "POST"])
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

@generator_bp.route("/genereaza_algoritm_propriu", methods=["POST"])
def genereaza_algoritm_propriu():
    data = request.get_json()
    nivel = data.get("nivel_selectat")
    an = data.get("an_selectat")
    grupe_selectate = data.get("grupe_selectate", [])

    if not nivel or not an:
        return jsonify({"error": "Parametri lipsă (nivel/an)"}), 400

    generator = AlgoritmClasic(nivel, an, grupe_selectate)
    orar = generator.genereaza()

    # Convertim defaultdict în dict normal înainte de return
    import json
    from flask import Response

    return Response(
        response=json.dumps({"orar": orar}, default=dict),
        status=200,
        mimetype="application/json"
    )
