import mysql.connector
import random
import re
from collections import defaultdict

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

    def get_criterii_default(self):
        return {
            "pauza_miercuri": "14:00-16:00",
            "max_ore_zi": 8,
            "pauza_dupa_6": True,
            "ore_master": ["16:00-18:00", "18:00-20:00"]
        }

    def actualizeaza_criterii(self, form_data):
        self.criterii["pauza_miercuri"] = form_data.get("pauza_miercuri", "14:00-16:00")
        self.criterii["max_ore_zi"] = int(form_data.get("max_ore_zi", 8))
        self.criterii["pauza_dupa_6"] = form_data.get("pauza_dupa_6", "True") == "True"
        self.criterii["ore_master"] = [s.strip() for s in form_data.get("ore_master", "").split(",") if s.strip()]

    def incarca_date(self):
        cursor = self.conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM profesori")
        self.profesori = cursor.fetchall()
        cursor.execute("SELECT * FROM sali")
        self.sali = cursor.fetchall()
        cursor.execute("SELECT * FROM grupe")
        self.grupe = cursor.fetchall()

    def extrage_an_si_nivel(self, grupa):
        if grupa.startswith("MI") or grupa.startswith("MII"):
            return "Master", grupa[:4]
        match = re.match(r"([IVX]+)(\d+)?[a-z]*", grupa)
        if match:
            return "Licenta", match.group(1)
        return "Necunoscut", "?"

    def genereaza_orar(self):
        self.incarca_date()
        orar = {}
        grupe_pe_an = defaultdict(list)

        for grupa in self.grupe:
            nume = grupa["denumire"]
            nivel, an = self.extrage_an_si_nivel(nume)
            if nivel != "Necunoscut":
                grupe_pe_an[f"{nivel}-{an}"].append(nume)

        for cheie_an, grupe_din_an in grupe_pe_an.items():
            orar_temp = {}  # activități comune (cursuri)
            for zi in self.zile:
                orar_temp[zi] = {}
                pauza_adaugata = False
                ore_adaugate = 0

                for interval in self.intervale:
                    if "Master" in cheie_an and interval not in self.criterii["ore_master"]:
                        orar_temp[zi][interval] = ""
                        continue
                    if zi == "Miercuri" and interval == self.criterii["pauza_miercuri"]:
                        orar_temp[zi][interval] = "Pauză forțată"
                        continue
                    if ore_adaugate >= 6 and not pauza_adaugata and self.criterii["pauza_dupa_6"]:
                        orar_temp[zi][interval] = "Pauză"
                        pauza_adaugata = True
                        continue
                    if ore_adaugate >= self.criterii["max_ore_zi"]:
                        orar_temp[zi][interval] = ""
                        continue

                    activitate = self.genereaza_activitate("master" if "Master" in cheie_an else "licenta")
                    orar_temp[zi][interval] = activitate
                    ore_adaugate += 2

            for grupa in grupe_din_an:
                orar_grupa = {}
                for zi in self.zile:
                    orar_grupa[zi] = {}
                    for interval in self.intervale:
                        activitate = orar_temp[zi][interval]
                        if "(Lab)" in activitate or "(Sem)" in activitate:
                            # regenerăm lab/seminar doar pentru această grupă
                            orar_grupa[zi][interval] = self.genereaza_activitate("master" if "Master" in cheie_an else "licenta")
                        else:
                            # păstrăm cursul comun
                            orar_grupa[zi][interval] = activitate
                orar[grupa] = orar_grupa

        return orar

    def genereaza_activitate(self, tip_grupa):
        if not self.profesori or not self.sali:
            return "Nimic"

        profesor = random.choice(self.profesori)
        nume_prof = profesor["nume"]
        discipline = [d.strip() for d in profesor["discipline"].split(",") if d.strip()]
        if not discipline:
            return "Nimic"

        disciplina = random.choice(discipline)
        tip_activitate = random.choice(["curs", "seminar", "laborator"])

        tip_sala = "Curs" if tip_activitate == "curs" else "Laborator/Seminar"
        sali_potrivite = [s for s in self.sali if s["tip"] == tip_sala]
        if not sali_potrivite:
            return "Fără sală"
        sala = random.choice(sali_potrivite)["cod"]

        acronim = "".join([c for c in disciplina if c.isupper()][:3]).upper()
        
        if tip_activitate == "curs":
            return f"{disciplina} ({acronim}) - {nume_prof} - sala {sala}"
        elif tip_activitate == "seminar":
            return f"{acronim} (Sem) - {nume_prof} - {sala}"
        else:  # laborator
            return f"{acronim} (Lab) - {nume_prof} - {sala}"



    def inchide_conexiunea(self):
        self.conn.close()


def genereaza_formular_criterii(criterii):
    return f"""
    <form method="post" style="margin-bottom: 30px;">
        <h3>Modifică criteriile de generare:</h3>
        <label>Pauză miercuri:</label>
        <input type="text" name="pauza_miercuri" value="{criterii['pauza_miercuri']}"><br><br>

        <label>Număr maxim de ore pe zi:</label>
        <input type="number" name="max_ore_zi" value="{criterii['max_ore_zi']}"><br><br>

        <label>Pauză după 6 ore:</label>
        <select name="pauza_dupa_6">
            <option value="True" {"selected" if criterii['pauza_dupa_6'] else ""}>Da</option>
            <option value="False" {"selected" if not criterii['pauza_dupa_6'] else ""}>Nu</option>
        </select><br><br>

        <label>Intervale orare master (virgulă):</label>
        <input type="text" name="ore_master" value="{", ".join(criterii['ore_master'])}"><br><br>

        <button type="submit">Generează orarul</button>
    </form>
    """


def genereaza_html(orar, criterii, formular_html):
    html = "<html><head><meta charset='utf-8'><title>Orar Generat</title><style>"
    html += """
    body { font-family: Arial; margin: 20px; background: #f9f9f9; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 30px; }
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
