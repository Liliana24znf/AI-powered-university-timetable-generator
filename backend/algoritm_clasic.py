import mysql.connector
from collections import defaultdict

class AlgoritmClasic:
    def __init__(self, nivel, an, grupe):
        self.nivel = nivel
        self.an = an
        self.grupe = grupe  # denumiri LI1a, LI1b etc.
        self.min_activitati_pe_zi = 2  # minim 2 activități/zi
        self.conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="licenta"
        )
        self.cursor = self.conn.cursor(dictionary=True)

        self.zile = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"]
        self.intervale = [
            "08:00-10:00", "10:00-12:00", "12:00-14:00",
            "14:00-16:00", "16:00-18:00", "18:00-20:00"
        ]
    def genereaza(self):
        orar = defaultdict(lambda: defaultdict(dict))
        profesori = self._get_profesori()
        sali = self._get_sali()

        used_slots = {
            "sali": defaultdict(set),
            "profesori": defaultdict(set)
        }

        for prof in profesori:
            # 🔁 Grupăm disciplinele după denumire
            discipline_grupate = defaultdict(list)
            for disc in prof["discipline"]:
                discipline_grupate[disc["denumire"]].append(disc)

            for denumire, variante in discipline_grupate.items():
                tipuri = [d["tip"].lower() for d in variante]
                acronim = ''.join([w[0] for w in denumire.split()]).lower()
                profesor = prof["nume"]

                # ⚠️ Etapă 1: începem prin a plasa activitățile practice
                activitati_plasate = []

                if "seminar" in tipuri:
                    for grupa in self.grupe:
                        zi, interval, sala = self._slot_valid("GS", used_slots, profesor, disponibilitate=prof.get("disponibilitate_parsata"))
                        orar[self.nivel][grupa].setdefault(zi, {})[interval] = {
                            "activitate": acronim.upper(),
                            "tip": "Seminar",
                            "profesor": profesor,
                            "sala": sala
                        }
                        activitati_plasate.append("seminar")

                if "proiect" in tipuri:
                    for grupa in self.grupe:
                        zi, interval, sala = self._slot_valid("GP", used_slots, profesor, disponibilitate=prof.get("disponibilitate_parsata"))
                        orar[self.nivel][grupa].setdefault(zi, {})[interval] = {
                            "activitate": acronim.upper(),
                            "tip": "Proiect",
                            "profesor": profesor,
                            "sala": sala
                        }
                        activitati_plasate.append("proiect")

                if "laborator" in tipuri:
                    subgrupe = [g for g in self.grupe if any(s in g[-1] for s in ["a", "b", "c", "d"])]
                    for subg in subgrupe:
                        zi, interval, sala = self._slot_valid("GL", used_slots, profesor, disponibilitate=prof.get("disponibilitate_parsata"))
                        orar[self.nivel][subg].setdefault(zi, {})[interval] = {
                            "activitate": acronim.upper(),
                            "tip": "Laborator",
                            "profesor": profesor,
                            "sala": sala
                        }
                        activitati_plasate.append("laborator")

                # ⚠️ Etapă 2: cursul se adaugă doar dacă a fost adăugată cel puțin o activitate practică
                if "curs" in tipuri and activitati_plasate:
                    zi, interval, sala = self._slot_valid("GC", used_slots, profesor, disponibilitate=prof.get("disponibilitate_parsata"))
                    for grupa in self.grupe:
                        orar[self.nivel][grupa].setdefault(zi, {})[interval] = {
                            "activitate": f"{denumire} ({acronim})",
                            "tip": "Curs",
                            "profesor": profesor,
                            "sala": sala
                        }

        self._raport_validare(orar)
        self._echilibrare_activitati_pe_zi(orar)
        return orar


    def _echilibrare_activitati_pe_zi(self, orar):
        print("\n🔄 ECHILIBRARE activități / zi")

        for grupa in self.grupe:
            zi_ore = defaultdict(int)
            activitati_grupa = orar[self.nivel][grupa]

            # Numărăm activitățile din fiecare zi
            for zi in self.zile:
                zi_ore[zi] = len(activitati_grupa.get(zi, {}))

            # Mutăm activități din zilele aglomerate în cele cu mai puțin de 2
            for zi in self.zile:
                if zi_ore[zi] >= self.min_activitati_pe_zi:
                    continue

                # Căutăm o zi suprapopulată de unde să mutăm
                for zi_din in sorted(self.zile, key=lambda z: zi_ore[z], reverse=True):
                    if zi_ore[zi_din] > self.min_activitati_pe_zi + 1:
                        activitati_din = activitati_grupa.get(zi_din, {})
                        if not activitati_din:
                            continue

                        interval_de_mutat = next(iter(activitati_din))  # prima activitate
                        activ_mutata = activitati_din.pop(interval_de_mutat)

                        # Găsim un interval liber în ziua subpopulată
                        for interval in self.intervale:
                            if interval not in activitati_grupa.get(zi, {}):
                                activitati_grupa.setdefault(zi, {})[interval] = activ_mutata
                                print(f"♻️ Mutat activitate '{activ_mutata['tip']}' din {zi_din} {interval_de_mutat} -> {zi} {interval} (grupa {grupa})")
                                zi_ore[zi_din] -= 1
                                zi_ore[zi] += 1
                                break
                        break  # o mutare per zi e suficientă

    def _get_profesori(self):
        self.cursor.execute("SELECT * FROM profesori")
        profesori = self.cursor.fetchall()

        self.cursor.execute("SELECT * FROM discipline_profesori")
        discipline = self.cursor.fetchall()

        prof_map = []
        for prof in profesori:
            disc = [d for d in discipline if d["profesor_id"] == prof["id"] and d["nivel"] == self.nivel]
            disponibilitate = prof.get("disponibilitate", "{}")
            try:
                import json
                disponibilitate = json.loads(disponibilitate)
            except Exception:
                disponibilitate = {}

            prof_map.append({
                **prof,
                "discipline": disc,
                "disponibilitate_parsata": disponibilitate  # 👈 nou
            })

        return prof_map


    def _get_sali(self):
        self.cursor.execute("SELECT * FROM sali")
        return self.cursor.fetchall()

    def _get_sali_tip(self, prefix):
        return [s["cod"] for s in self._get_sali() if s["cod"].startswith(prefix)]

    def _slot_valid(self, prefix, used_slots, profesor=None, disponibilitate=None):
        if self.nivel.lower() == "master":
            intervale_permise = ["16:00-18:00", "18:00-20:00"]
        else:
            intervale_permise = self.intervale

        # Dacă nu s-a transmis disponibilitatea, nu restricționăm
        if disponibilitate is None:
            disponibilitate = {zi: intervale_permise for zi in self.zile}

        zi_load = {
            zi: sum(len(used_slots["sali"][f"{zi}-{intv}"]) for intv in intervale_permise)
            for zi in self.zile
        }
        zile_ordonate = sorted(self.zile, key=lambda z: zi_load[z])

        for zi in zile_ordonate:
            for interval in intervale_permise:
                if zi == "Miercuri" and interval == "14:00-16:00":
                    continue
                if interval not in disponibilitate.get(zi, []):
                    continue  # ⛔ nu este disponibil

                for sala in self._get_sali_tip(prefix):
                    key = f"{zi}-{interval}"
                    if (
                        sala not in used_slots["sali"][key]
                        and (not profesor or profesor not in used_slots["profesori"][key])
                    ):
                        used_slots["sali"][key].add(sala)
                        if profesor:
                            used_slots["profesori"][key].add(profesor)
                        return zi, interval, sala

        return "Luni", "08:00-10:00", "FaraSala"



    def _raport_validare(self, orar):
        print("\n📋 RAPORT VALIDARE ORAR")
        for grupa in self.grupe:
            tipuri = set()
            total = 0
            zi_ore = defaultdict(int)

            for zi in self.zile:
                activitati = orar[self.nivel][grupa].get(zi, {})
                for interval, activ in activitati.items():
                    tipuri.add(activ.get("tip", "").lower())
                    total += 1
                    zi_ore[zi] += 1

            print(f"\n📘 Grupa: {grupa}")
            print(f"🕒 Total activități: {total}")
            if "curs" not in tipuri:
                print("❌ Lipsă: Curs")
            if "seminar" not in tipuri:
                print("❌ Lipsă: Seminar")
            if "laborator" not in tipuri:
                print("❌ Lipsă: Laborator")
            if "proiect" not in tipuri:
                print("❌ Lipsă: Proiect")

            for zi, nr in zi_ore.items():
                limita = 4 if self.nivel.lower() == "master" else 4
                if nr < limita:
                    print(f"⚠️ {zi} are {nr} activități (maxim recomandat: {limita})")

