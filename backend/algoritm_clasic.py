import mysql.connector
from collections import defaultdict

class AlgoritmClasic:
    def __init__(self, nivel, an, grupe=None):
        self.nivel = nivel
        self.an = an

        # ❗ Conectare la baza de date trebuie făcută înainte de orice apel la metode
        self.conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="licenta"
        )
        self.cursor = self.conn.cursor(dictionary=True)

        # 🔄 După ce ai cursorul, poți apela _get_grupe()
        self.grupe = grupe if grupe else self._get_grupe()
        print(f"✔️ Grupe încărcate: {self.grupe}")


        self.min_activitati_pe_zi = 2
        self.zile = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"]
        self.intervale = [
            "08:00-10:00", "10:00-12:00", "12:00-14:00",
            "14:00-16:00", "16:00-18:00", "18:00-20:00"
        ]

        




    def genereaza(self):
        
        cursuri_per_an = defaultdict(lambda: defaultdict(int))
        proiecte_per_an = defaultdict(lambda: defaultdict(int))

        orar = defaultdict(lambda: defaultdict(dict))
        profesori = self._get_profesori()

        used_slots = {
            "sali": defaultdict(set),
            "profesori": defaultdict(set)
        }
        if self.nivel.lower() == "master":
            max_pe_zi = 2
        else:
            max_pe_zi = 4




        for prof in profesori:
            # 🔁 Grupăm disciplinele după denumire
            discipline_grupate = defaultdict(list)
            for disc in prof["discipline"]:
                discipline_grupate[disc["denumire"]].append(disc)

            for denumire, variante in discipline_grupate.items():
                tipuri = [d["tip"].lower() for d in variante]
                acronim = ''.join([w[0] for w in denumire.split()]).lower()
                profesor = prof["nume"]

                # ⚠️ Etapă 1: plasăm cursurile
                if "curs" in tipuri:
                    prefix = f"{self.nivel[0]}{self.an[-1]}"  # Ex: "L2" pentru LI2a
                    grupe_an = [g for g in self.grupe if g.startswith(prefix)]

                    if cursuri_per_an[self.nivel][self.an] >= 9:
                        continue

                    if any(
                        f"{denumire} ({acronim})" in [
                            v.get("activitate", "")
                            for zi in orar[self.nivel][g].values()
                            for v in zi.values()
                        ]
                        for g in grupe_an
                    ):
                        continue

                    # 🟦 CURS
                    zi, interval, sala = self._slot_valid("GC", used_slots, profesor, disponibilitate=prof.get("disponibilitate_parsata"))
                    # Evită depășirea numărului maxim de activități
                    if any(len(orar[self.nivel][g].get(zi, {})) >= max_pe_zi for g in grupe_an):
                        continue

                    for g in grupe_an:
                        orar[self.nivel][g].setdefault(zi, {})[interval] = {
                            "activitate": f"{denumire} ({acronim})",
                            "tip": "Curs",
                            "profesor": profesor,
                            "sala": sala
                        }
                    cursuri_per_an[self.nivel][self.an] += 1
                    print(f"📌 Curs sincronizat {denumire} pentru {grupe_an} → {zi}, {interval}, sala: {sala}")


               
                # 🟨 Etapă 2: plasăm proiectele sincronizate pe GRUPĂ (ex: LI1a + LI1b)
                prefixuri_grupe = set(g[:-1] for g in self.grupe if len(g) >= 3)
                for prefix in prefixuri_grupe:
                    grupe_grupa = [g for g in self.grupe if g.startswith(prefix)]

                    # opțional: maxim 3 proiecte per an
                    if proiecte_per_an[self.nivel][self.an] >= 3:
                        continue

                    # verificăm dacă proiectul deja a fost plasat
                    if any(
                        acronim.upper() in v.get("activitate", "") and v.get("tip", "").lower() == "proiect"
                        for g in grupe_grupa
                        for zi in orar[self.nivel][g].values()
                        for v in zi.values()
                    ):
                        continue

                    for zi_p in self.zile:
                        for interval_p in self.intervale:
                            if zi_p == "Miercuri" and interval_p == "14:00-16:00":
                                continue
                            if interval_p not in prof.get("disponibilitate_parsata", {}).get(zi_p, []):
                                continue
                            if any(interval_p in orar[self.nivel][g].get(zi_p, {}) for g in grupe_grupa):
                                continue

                            sala_p = None
                            for s in self._get_sali_tip("GP"):
                                key_p = f"{zi_p}-{interval_p}"
                                if s not in used_slots["sali"][key_p] and profesor not in used_slots["profesori"][key_p]:
                                    sala_p = s
                                    used_slots["sali"][key_p].add(sala_p)
                                    used_slots["profesori"][key_p].add(profesor)
                                    break

                            # Verifică dacă în ziua respectivă grupele au deja prea multe activități
                            if any(len(orar[self.nivel][g].get(zi_p, {})) >= max_pe_zi for g in grupe_grupa):
                                continue


                            if sala_p:
                                for g in grupe_grupa:
                                    orar[self.nivel][g].setdefault(zi_p, {})[interval_p] = {
                                        "activitate": acronim.upper(),
                                        "tip": "Proiect",
                                        "profesor": profesor,
                                        "sala": sala_p
                                    }
                                proiecte_per_an[self.nivel][self.an] += 1
                                print(f"📒 Proiect {acronim.upper()} sincronizat pentru {grupe_grupa} → {zi_p} {interval_p} {sala_p}")
                                break
                        else:
                            continue
                        break


                # 🟩 Etapă 3: plasăm laboratoarele
                for grupa in self.grupe:
                    for zi_l in self.zile:
                        for interval_l in self.intervale:
                            if zi_l == "Miercuri" and interval_l == "14:00-16:00":
                                continue
                            if interval_l not in prof.get("disponibilitate_parsata", {}).get(zi_l, []):
                                continue
                            if interval_l in orar[self.nivel][grupa].get(zi_l, {}):
                                continue

                            sala_l = None
                            for s in self._get_sali_tip("GL"):
                                key_l = f"{zi_l}-{interval_l}"
                                if s not in used_slots["sali"][key_l] and profesor not in used_slots["profesori"][key_l]:
                                    sala_l = s
                                    used_slots["sali"][key_l].add(sala_l)
                                    used_slots["profesori"][key_l].add(profesor)
                                    break
                            
                            # Blochează suprasarcina pe zi
                            if len(orar[self.nivel][grupa].get(zi_l, {})) >= max_pe_zi:
                                continue

                            
                            if sala_l:
                                orar[self.nivel][grupa].setdefault(zi_l, {})[interval_l] = {
                                    "activitate": acronim.upper(),
                                    "tip": "Laborator",
                                    "profesor": profesor,
                                    "sala": sala_l
                                }
                                print(f"📗 Laborator {acronim.upper()} → grupa {grupa} → {zi_l} {interval_l} {sala_l}")
                                break
                        else:
                            continue
                        break   
                
               # 🟪 Etapă 4: plasăm seminariile sincronizate pe GRUPĂ (ex: LI1a + LI1b)
                prefixuri_grupe = set(g[:-1] for g in self.grupe if len(g) >= 3)
                for prefix in prefixuri_grupe:
                    grupe_grupa = [g for g in self.grupe if g.startswith(prefix)]
                    for zi_s in self.zile:
                        for interval_s in self.intervale:
                            if zi_s == "Miercuri" and interval_s == "14:00-16:00":
                                continue
                            if interval_s not in prof.get("disponibilitate_parsata", {}).get(zi_s, []):
                                continue
                            if any(interval_s in orar[self.nivel][g].get(zi_s, {}) for g in grupe_grupa):
                                continue

                            sala_s = None
                            for s in self._get_sali_tip("GS"):
                                key_s = f"{zi_s}-{interval_s}"
                                if s not in used_slots["sali"][key_s] and profesor not in used_slots["profesori"][key_s]:
                                    sala_s = s
                                    used_slots["sali"][key_s].add(sala_s)
                                    used_slots["profesori"][key_s].add(profesor)
                                    break

                            if any(len(orar[self.nivel][g].get(zi_s, {})) >= max_pe_zi for g in grupe_grupa):
                                continue

                            
                            if sala_s:
                                for g in grupe_grupa:
                                    orar[self.nivel][g].setdefault(zi_s, {})[interval_s] = {
                                        "activitate": acronim.upper(),
                                        "tip": "Seminar",
                                        "profesor": profesor,
                                        "sala": sala_s
                                    }
                                print(f"📘 Seminar {acronim.upper()} sincronizat pentru {grupe_grupa} → {zi_s} {interval_s} {sala_s}")
                                break
                        else:
                            continue
                        break

                # 🟧 Etapă 5:

        self._raport_validare(orar)
        self._echilibrare_activitati_pe_zi(orar)
        self.valideaza_cursuri_sincronizate(orar)
        self._verifica_pauze(orar)

        return orar


    def _echilibrare_activitati_pe_zi(self, orar):
        print("\n🔄 ECHILIBRARE activități / zi")
        if self.nivel.lower() == "master":
            min_pe_zi = 0
            max_pe_zi = 2
        else:
            min_pe_zi = 2  # echivalent cu 4 ore
            max_pe_zi = 4  # echivalent cu 8 ore


        for grupa in self.grupe:
            zi_ore = defaultdict(int)
            activitati_grupa = orar[self.nivel][grupa]

            # Numărăm activitățile din fiecare zi
            for zi in self.zile:
                zi_ore[zi] = len(activitati_grupa.get(zi, {}))

        for grupa in self.grupe:
            zi_ore = defaultdict(int)
            activitati_grupa = orar[self.nivel][grupa]

            # Numărăm activitățile din fiecare zi
            for zi in self.zile:
                zi_ore[zi] = len(activitati_grupa.get(zi, {}))

            # Mutăm activități din zilele aglomerate în cele cu mai puțin de 2
            for zi in self.zile:
                if zi_ore[zi] >= min_pe_zi:
                    continue

                # Căutăm o zi suprapopulată de unde să mutăm
                for zi_din in sorted(self.zile, key=lambda z: zi_ore[z], reverse=True):
                    if zi_ore[zi_din] > max_pe_zi:

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

    def valideaza_cursuri_sincronizate(self, orar):
        print("\n🧪 VALIDARE CURSURI SINCRONIZATE PE AN")
        if self.nivel.lower() == "master":
            min_pe_zi = 0
            max_pe_zi = 2
        else:
            min_pe_zi = 2  # echivalent cu 4 ore
            max_pe_zi = 4  # echivalent cu 8 ore

        cursuri_an = defaultdict(lambda: defaultdict(list))  # {prefix_an: {activitate: [grupe]}}

        for grupa in self.grupe:
            prefix_an = ''.join(filter(str.isalpha, grupa)) + ''.join(filter(str.isdigit, grupa))
            activitati = [
                (zi, interval, info["activitate"])
                for zi in self.zile
                for interval, info in orar[self.nivel][grupa].get(zi, {}).items()
                if info["tip"].lower() == "curs"
            ]
            for zi, interval, act in activitati:
                cursuri_an[prefix_an][act].append((grupa, zi, interval))

        # analizăm fiecare activitate
        for prefix_an, activitati in cursuri_an.items():
            toate_grupele = [g for g in self.grupe if g.startswith(prefix_an)]
            for act, plasari in activitati.items():
                grupe_cu_act = [g for g, _, _ in plasari]
                if set(grupe_cu_act) != set(toate_grupele):
                    grupe_lipsa = list(set(toate_grupele) - set(grupe_cu_act))
                    print(f"❌ Cursul '{act}' nu este sincronizat în toate grupele din {prefix_an}. Lipsesc din: {', '.join(sorted(grupe_lipsa))}")
                else:
                    # verificăm dacă sunt plasate în același slot
                    toate_sloturile = set((zi, interval) for _, zi, interval in plasari)
                    if len(toate_sloturile) > 1:
                        print(f"⚠️ Cursul '{act}' din {prefix_an} este plasat în sloturi diferite: {toate_sloturile}")
                    else:
                        print(f"✅ Cursul '{act}' este sincronizat corect în toate grupele din {prefix_an}")


        print("\n🔄 ECHILIBRARE activități / zi")

        for grupa in self.grupe:
            zi_ore = defaultdict(int)
            activitati_grupa = orar[self.nivel][grupa]

            # Numărăm activitățile din fiecare zi
            for zi in self.zile:
                zi_ore[zi] = len(activitati_grupa.get(zi, {}))

            # Mutăm activități din zilele aglomerate în cele cu mai puțin de 2
            for zi in self.zile:
                if zi_ore[zi] >= min_pe_zi:
                    continue

                # Căutăm o zi suprapopulată de unde să mutăm
                for zi_din in sorted(self.zile, key=lambda z: zi_ore[z], reverse=True):
                    if zi_ore[zi_din] > max_pe_zi:
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

    def _get_grupe(self):
        self.cursor.execute("SELECT * FROM grupe WHERE nivel = %s AND an = %s", (self.nivel, self.an))
        rezultate = self.cursor.fetchall()
        print("\n👥 GRUPE DIN BAZA DE DATE:")
        for g in rezultate:
            print(g)

        # Presupunem că ai un câmp „denumire” în tabelul grupe
        return [g["denumire"] for g in rezultate]


    def _get_profesori(self):
        self.cursor.execute("SELECT * FROM profesori")
        profesori = self.cursor.fetchall()
        print("\n🧑‍🏫 PROFESORI DIN BAZA DE DATE:")
        for p in profesori:
            print(p)

        self.cursor.execute("SELECT * FROM discipline_profesori")
        discipline = self.cursor.fetchall()
        print("\n📚 DISCIPLINE ASOCIATE PROFESORI:")
        for d in discipline:
            print(d)

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
                "disponibilitate_parsata": disponibilitate
            })

        print("\n🔍 PROFESORI PARSAȚI COMPLET:")
        for p in prof_map:
            print(p)

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


        self.cursor.execute("SELECT * FROM grupe WHERE nivel = %s AND an = %s", (self.nivel, self.an))
        rezultate = self.cursor.fetchall()
        print("\n👥 GRUPE DIN BAZA DE DATE:")
        for g in rezultate:
            print(g)

        # Presupunem că ai un câmp „denumire” în tabelul grupe
        return [g["denumire"] for g in rezultate]

    def _verifica_pauze(self, orar):
        for grupa in self.grupe:
            for zi in self.zile:
                sloturi = sorted(orar[self.nivel][grupa].get(zi, {}).keys())
                if not sloturi:
                    continue
                for i in range(len(sloturi) - 1):
                    ora1 = self.intervale.index(sloturi[i])
                    ora2 = self.intervale.index(sloturi[i + 1])
                    if ora2 - ora1 > 1:
                        print(f"⚠️ Pauză mare între {sloturi[i]} și {sloturi[i+1]} pentru {grupa} în {zi}")


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
                if self.nivel.lower() == "master":
                    if nr > 2:
                        print(f"⚠️ {zi} are {nr} activități (maxim admis pentru master: 2)")
                else:
                    if nr < 2:
                        print(f"⚠️ {zi} are doar {nr} activități (minim necesar pentru licență: 2)")
                    if nr > 4:
                        print(f"⚠️ {zi} are {nr} activități (maxim admis pentru licență: 4)")
