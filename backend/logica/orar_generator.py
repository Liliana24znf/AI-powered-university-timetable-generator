import mysql.connector
import random
import json
import re
from collections import defaultdict
import copy
from logica.validare import ValidatorOrar, valideaza_orar




class OrarGenerator:
    def __init__(self):
        
        self.conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="licenta"
        )
        self.zile = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"]
        self.intervale = [
            "08:00-10:00", "10:00-12:00", "12:00-14:00",
            "14:00-16:00", "16:00-18:00", "18:00-20:00"
        ]
        self.criterii = self.get_criterii_default()
        self.nivel = "Licenta"
        self.an = "I"
        self.grupe = [] 
        self.profesori = []
        self.sali = []
        self.mapare_grupe = {}  # va conține denumirea grupei
        self.grupa_si_subgrupa = {}  # va conține informații despre grupa de bază și subgrupă
        self.incarca_date()
        self.nivel = "Licenta"  # sau "Master"

        
    
    def get_criterii_default(self):
        return {
            "pauza_miercuri": "14:00-16:00",
            "max_ore_zi": 8,
            "pauza_dupa_6": True,
            "ore_master": ["16:00-18:00", "18:00-20:00"]
        }

        
    def actualizeaza_criterii(self, form_data):
        # Actualizează criteriile pe baza datelor din formular
        if "pauza_miercuri" in form_data:
            self.criterii["pauza_miercuri"] = form_data["pauza_miercuri"]
            self.pauza_miercuri = form_data["pauza_miercuri"]
        if "max_ore_zi" in form_data:
            self.criterii["max_ore_zi"] = form_data["max_ore_zi"]
            self.max_ore_zi = form_data["max_ore_zi"]
        if "pauza_dupa_6" in form_data:
            self.criterii["pauza_dupa_6"] = form_data["pauza_dupa_6"]
            self.pauza_dupa_6 = form_data["pauza_dupa_6"]
        if "ore_master" in form_data:
            self.criterii["ore_master"] = [form_data["ore_master"]]

    def incarca_date(self):
        cursor = self.conn.cursor(dictionary=True)

        # Profesori și discipline
        cursor.execute("SELECT * FROM profesori")
        profesori_raw = cursor.fetchall()

        cursor.execute("SELECT * FROM discipline_profesori")
        discipline_raw = cursor.fetchall()

        discipline_pe_profesor = defaultdict(lambda: defaultdict(lambda: {"nivel": "", "tipuri": []}))
        for row in discipline_raw:
            prof_id = row["profesor_id"]
            denumire = row["denumire"]
            nivel = row["nivel"]
            tip = row["tip"]
            key = (denumire, nivel)
            discipline_pe_profesor[prof_id][key]["nivel"] = nivel
            discipline_pe_profesor[prof_id][key]["tipuri"].append(tip)

        profesori = []
        for prof in profesori_raw:
            prof_id = prof["id"]
            try:
                prof["disponibilitate"] = json.loads(prof["disponibilitate"])
            except:
                prof["disponibilitate"] = {}

            prof["discipline"] = []
            for (den, niv), info in discipline_pe_profesor.get(prof_id, {}).items():
                prof["discipline"].append({
                    "denumire": den,
                    "nivel": niv,
                    "tipuri": info["tipuri"]
                })

            profesori.append(prof)

        self.profesori = profesori

        # Sali și Grupe
        cursor.execute("SELECT * FROM sali")
        self.sali = cursor.fetchall()

        cursor.execute("SELECT * FROM grupe")
        self.grupe = cursor.fetchall()
        self.mapare_grupe = {
            g["denumire"]: (g["nivel"], {1: "I", 2: "II", 3: "III", 4: "IV"}.get(g["an"], str(g["an"])))
            for g in self.grupe
        }
        self.grupa_si_subgrupa = {
            g["denumire"]: {
                "grupa_baza": f"{g['nivel'][0]}{g['an']}{g['grupa']}",  # ex: LIII1
                "subgrupa": g["subgrupa"]
            }
            for g in self.grupe
        }



    def extrage_an_si_nivel(self, cod_grupa):
        # Exemplu: LM2a -> Master, II
        nivel = "Necunoscut"
        an = "?"
        if cod_grupa.startswith("LM"):
            nivel = "Master"
            if len(cod_grupa) > 2 and cod_grupa[2].isdigit():
                an = { "1": "I", "2": "II", "3": "III" }.get(cod_grupa[2], "?")
        elif cod_grupa.startswith("L"):
            nivel = "Licenta"
            if len(cod_grupa) > 1 and cod_grupa[1].isdigit():
                an = { "1": "I", "2": "II", "3": "III" }.get(cod_grupa[1], "?")
        return nivel, an


    def genereaza_orar(self):
        from collections import defaultdict
        import copy

        self.incarca_date()
        orar = {}
        grupe_pe_an = defaultdict(set)
        subgrupe_map = defaultdict(set)
        cursuri_generate_pe_an = defaultdict(set)

        for g in self.grupe:
            den = g["denumire"]
            nivel, an = self.mapare_grupe[den]
            grupa_baza = self.grupa_si_subgrupa.get(den, {}).get("grupa_baza", "")
            grupe_pe_an[f"{nivel}-{an}"].add(den)
            if g["subgrupa"]:
                subgrupe_map[grupa_baza].add(den)

        for cheie_an, grupe_din_an in grupe_pe_an.items():
            grupe_din_an = list(grupe_din_an)
            orar_an = {zi: {} for zi in self.zile}
            nivel_curent = "master" if "Master" in cheie_an else "licenta"

            # === Etapa 1: Generare CURSURI comune ===
            denumiri_generate = set()
            for zi in self.zile:
                ore_adaugate = 0
                pauza_adaugata = False
                for interval in self.intervale:
                    if nivel_curent == "master" and interval not in self.criterii["ore_master"]:
                        orar_an[zi][interval] = ""
                        continue
                    if zi == "Miercuri" and interval == self.criterii["pauza_miercuri"]:
                        orar_an[zi][interval] = "Pauză forțată"
                        continue
                    if ore_adaugate >= 6 and not pauza_adaugata:
                        orar_an[zi][interval] = "Pauză"
                        ore_adaugate += 2
                        pauza_adaugata = True
                        continue
                    if ore_adaugate >= self.criterii["max_ore_zi"]:
                        orar_an[zi][interval] = ""
                        continue

                    activitate = self.genereaza_activitate(nivel_curent, zi, interval, tip="Curs")
                    if not activitate or "(C)" not in activitate:
                        orar_an[zi][interval] = ""
                        continue

                    den_curs = activitate.split(" (")[0].strip()
                    if nivel_curent == "licenta" and len(denumiri_generate) >= 9:
                        orar_an[zi][interval] = ""
                        continue
                    if nivel_curent == "master" and len(denumiri_generate) >= 5:
                        orar_an[zi][interval] = ""
                        continue

                    denumiri_generate.add(den_curs)
                    orar_an[zi][interval] = activitate
                    ore_adaugate += 2

            # 🧠 Salvăm cursurile generate
            cursuri_generate_pe_an[cheie_an] = denumiri_generate

            # Copiem cursurile în toate grupele
            for grupa in grupe_din_an:
                orar[grupa] = copy.deepcopy(orar_an)
                for subgrupa in subgrupe_map.get(grupa, []):
                    orar[subgrupa] = copy.deepcopy(orar_an)

            # === Etapa 2: Seminare/Proiecte per grupă ===
            for grupa in grupe_din_an:
                for zi in self.zile:
                    for interval in self.intervale:
                        activitate = orar[grupa][zi].get(interval, "")
                        if "(Sem)" in activitate or "(P)" in activitate or "(Proj)" in activitate:
                            den = activitate.split(" (")[0].strip()
                            if den not in cursuri_generate_pe_an[cheie_an]:
                                orar[grupa][zi][interval] = ""
                                continue
                            orar[grupa][zi][interval] = self.genereaza_activitate(nivel_curent, zi, interval)

                            for subgrupa in subgrupe_map.get(grupa, []):
                                orar[subgrupa][zi][interval] = orar[grupa][zi][interval]

            # === Etapa 3: Laboratoare per subgrupă ===
            for grupa in grupe_din_an:
                for subgrupa in subgrupe_map.get(grupa, []):
                    for zi in self.zile:
                        for interval in self.intervale:
                            activitate = orar[subgrupa][zi].get(interval, "")
                            if "(Lab)" in activitate:
                                den = activitate.split(" (")[0].strip()
                                if den not in cursuri_generate_pe_an[cheie_an]:
                                    orar[subgrupa][zi][interval] = ""
                                else:
                                    orar[subgrupa][zi][interval] = self.genereaza_activitate(nivel_curent, zi, interval)

        return orar

    def genereaza_activitate(self, tip_grupa, zi=None, interval=None, tip=None):
        profesori_potriviti = []

        for profesor in self.profesori:
            disponibile = profesor.get("disponibilitate", {}).get(zi, [])
            if interval not in disponibile:
                continue

            for disc in profesor.get("discipline", []):
                if disc["nivel"] != tip_grupa.capitalize():
                    continue
                for tip in disc["tipuri"]:
                    profesori_potriviti.append({
                        "nume": profesor["nume"],
                        "disciplina": disc["denumire"],
                        "tip_activitate": tip,
                        "nivel": disc["nivel"]
                    })

        if not profesori_potriviti:
            return "Niciun profesor disponibil"

        activ = random.choice(profesori_potriviti)
        disciplina = activ["disciplina"]
        tip_activitate = activ["tip_activitate"]
        nume_prof = activ["nume"]

        if tip_activitate == "Curs":
            sali_potrivite = [s for s in self.sali if s["tip"] == "Curs"]
        elif tip_activitate == "Seminar":
            sali_potrivite = [s for s in self.sali if s["tip"] in ["Seminar"]]
        elif tip_activitate == "Laborator":
            sali_potrivite = [s for s in self.sali if s["tip"] in ["Laborator"]]
        elif tip_activitate == "Proiect":
            sali_potrivite = [s for s in self.sali if s["tip"] in ["Proiect"]]
        else:
            sali_potrivite = []


        if not sali_potrivite:
            print(f"⚠️ Fără sală potrivită pentru {tip_activitate}")
            return "Fără sală"

        sala = random.choice(sali_potrivite)["cod"]
        acronim = "".join([c for c in disciplina if c.isupper()][:3]).upper()

        if tip_activitate == "Curs":
            return f"{disciplina} ({acronim}) - {nume_prof} - sala {sala}"
        elif tip_activitate == "Seminar":
            return f"{acronim} (Sem) - {nume_prof} - sala {sala}"
        elif tip_activitate == "Proiect":
            return f"{acronim} (P) - {nume_prof} - sala {sala}"
        else:
            return f"{acronim} (Lab) - {nume_prof} - {sala}"
        


    def inchide_conexiunea(self):
        self.conn.close()

# 🔽 Adaugă asta la finalul fișierului orar_generator.py


def genereaza_formular_criterii(criterii, nivel_selectat="Licenta", an_selectat="I"):
    return f"""
    <form method="post" action="/genereaza_orar_propriu" style="margin-bottom: 30px; font-family: sans-serif; max-width: 500px;">

        <h3 style="color: #333;">🔧 Modifică criteriile de generare</h3>

        <label for="nivel">🎓 Nivel de studii:</label><br>
        <select name="nivel" id="nivel" required>
            <option value="Licenta" {"selected" if nivel_selectat == "Licenta" else ""}>Licență</option>
            <option value="Master" {"selected" if nivel_selectat == "Master" else ""}>Master</option>
        </select><br><br>

        <label for="an">📘 Anul de studiu:</label><br>
        <select name="an" id="an" required>
            <option value="I" {"selected" if an_selectat == "I" else ""}>Anul I</option>
            <option value="II" {"selected" if an_selectat == "II" else ""}>Anul II</option>
            <option value="III" {"selected" if an_selectat == "III" else ""}>Anul III</option>
            <option value="IV" {"selected" if an_selectat == "IV" else ""}>Anul IV</option>
        </select><br><br>

        <label for="pauza_miercuri">⏰ Pauză miercuri (ex: 14:00–16:00):</label><br>
        <input type="text" id="pauza_miercuri" name="pauza_miercuri" value="{criterii['pauza_miercuri']}" required><br><br>

        <label for="max_ore_zi">📅 Număr maxim de ore pe zi:</label><br>
        <input type="number" id="max_ore_zi" name="max_ore_zi" value="{criterii['max_ore_zi']}" min="1" max="12" required><br><br>

        <label for="pauza_dupa_6">☕ Pauză după 6 ore de activitate?</label><br>
        <select name="pauza_dupa_6" id="pauza_dupa_6" required>
            <option value="True" {"selected" if criterii['pauza_dupa_6'] else ""}>Da</option>
            <option value="False" {"selected" if not criterii['pauza_dupa_6'] else ""}>Nu</option>
        </select><br><br>

        <label for="ore_master">📈 Intervalele orare pentru master (separate prin virgulă):</label><br>
        <input type="text" id="ore_master" name="ore_master" value="{", ".join(criterii['ore_master'])}" placeholder="ex: 16:00-18:00, 18:00-20:00" required><br><br>

        <button type="submit" style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px;">
            Generează orarul
        </button>
    </form>
    """



def genereaza_html(orar, criterii, formular_html):
    html = "<html><head><meta charset='utf-8'><title>Orar Generat</title><style>"
    html += """
    body { font-family: Arial; margin: 20px; background: #f9f9f9; }
    table { border-collapse: collapse; inline-size: 100%; margin-block-end: 30px; }
    th, td { border: 1px solid #aaa; padding: 8px; text-align: center; font-size: 14px; }
    th { background-color: #e0e0e0; }
    h2 { background-color: #333; color: white; padding: 10px; }
    </style></head><body>
    """
    html += "<h1>Orar Generat Automat</h1>"
    html += formular_html + "<hr>"

    intervale = ["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00", "18:00-20:00"]

    for grupa, zile in orar.items():
        html += f"<h2>Grupa: {grupa}</h2><table><tr><th>Ziua / Interval</th>"
        for interval in intervale:
            html += f"<th>{interval}</th>"
        html += "</tr>"
        for zi, activitati in zile.items():
            html += f"<tr><td><b>{zi}</b></td>"
            for interval in intervale:
                activitate = activitati.get(interval, "")
                html += f"<td>{activitate}</td>"
            html += "</tr>"
        html += "</table><br>"

    html += "</body></html>"
    return html
