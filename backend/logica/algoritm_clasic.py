import mysql.connector
from collections import defaultdict
import random
from logica.validare import ValidatorOrar

class AlgoritmClasic:
    def __init__(self, nivel, an, grupe=None):
        # Inițializare algoritm clasic
        self.nivel = nivel
        self.an = an


        # Conectare la baza de date
        self.conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="licenta"
        )
        self.cursor = self.conn.cursor(dictionary=True)

        # După ce ai cursorul, poți apela _get_grupe()
        self.grupe = grupe if grupe else self._get_grupe()
        print(f"✔️ Grupe încărcate: {self.grupe}")

        # Setări generale pentru generare
        # minim 3 activități pe zi (de ex. echivalent cu 4 ore)
        self.min_activitati_pe_zi = 3
        self.zile = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"]
        self.intervale = [
            "08:00-10:00", "10:00-12:00", "12:00-14:00",
            "14:00-16:00", "16:00-18:00", "18:00-20:00"
        ]
    
    def genereaza(self):

        # 🎯 Setăm limitele pentru numărul de cursuri
        if self.nivel.lower() == "master":
            max_pe_zi = 2
            nr_max_cursuri = 4
        else:
            max_pe_zi = 3
            nr_max_cursuri = 10

        # 📝 Seturi și dicționare pentru urmărirea generării orarului

        # Set în care rețin toate cursurile deja generate (după denumire și acronim)
        # pentru a evita duplicările la activitățile practice
        cursuri_generate = set()

        # Dicționar cu contor pentru numărul de cursuri deja alocate pe nivel și an
        # Ex: cursuri_per_an["Licenta"]["I"] = 5
        cursuri_per_an = defaultdict(lambda: defaultdict(int))

        # Similar, contor pentru numărul de proiecte deja alocate pe nivel și an
        proiecte_per_an = defaultdict(lambda: defaultdict(int))

        # Structura principală a orarului generat:
        # orar[nivel][grupa][zi][interval] = {...}
        orar = defaultdict(lambda: defaultdict(dict))

        # 🔄 Încărcăm profesorii din baza de date împreună cu disciplinele lor
        profesori = self._get_profesori()

        # Dicționar pentru urmărirea sălilor și profesorilor deja folosiți
        # în fiecare interval de timp, pentru a evita suprapunerile
        used_slots = {
            "sali": defaultdict(set),       # ex: used_slots["sali"]["Luni-10:00-12:00"] = {"GC5"}
            "profesori": defaultdict(set)   # ex: used_slots["profesori"]["Luni-10:00-12:00"] = {"Popescu"}
        }


        # === ETAPA 1: Generare cursuri comune pe an ===
        for prof in profesori:
            # Grupăm disciplinele profesorului după denumire (ex: "Baze de date")
            discipline_grupate = defaultdict(list)
            for disc in prof["discipline"]:
                discipline_grupate[disc["denumire"]].append(disc)

            for denumire, variante in discipline_grupate.items():
                # Extragem tipurile de activități (ex: ["curs", "laborator"])
                tipuri = [d["tip"].lower() for d in variante]
                # Formăm un acronim simplu din inițialele denumirii (ex: "Baze de date" → "bd")
                acronim = ''.join([w[0] for w in denumire.split()]).lower()
                profesor = prof["nume"]

                # Continuăm doar dacă există un curs teoretic pentru această disciplină
                if "curs" not in tipuri:
                    continue

                # Identificăm grupele din anul curent (ex: LI1a, LI1b...)
                prefix = self._prefix_grupa()
                grupe_an = [g for g in self.grupe if g.startswith(prefix)]

                # Verificăm dacă am atins deja numărul maxim de cursuri pentru acest an
                if cursuri_per_an[self.nivel][self.an] >= nr_max_cursuri:
                    continue

                # Evităm dublarea aceluiași curs deja programat
                if any(
                    f"{denumire} ({acronim})" in [
                        v.get("activitate", "")
                        for zi in orar[self.nivel][g].values()
                        for v in zi.values()
                    ]
                    for g in grupe_an
                ):
                    continue

                # Alegem un slot valid (zi, interval, sală) pentru acest curs
                zi, interval, sala = self._slot_valid(
                    "GC", 
                    used_slots, 
                    profesor, 
                    disponibilitate=prof.get("disponibilitate_parsata")
                )

                # Verificăm să nu depășim numărul maxim de activități pe zi
                if any(len(orar[self.nivel][g].get(zi, {})) >= max_pe_zi for g in grupe_an):
                    continue

                # Alocăm cursul în orar pentru toate grupele din an (curs comun)
                for g in grupe_an:
                    orar[self.nivel][g].setdefault(zi, {})[interval] = {
                        "activitate": f"{denumire} ({acronim})",
                        "tip": "Curs",
                        "profesor": profesor,
                        "sala": sala
                    }

                # Înregistrăm cursul ca generat și incrementăm contorul pentru anul curent
                cursuri_generate.add((denumire.lower(), acronim.lower()))
                cursuri_per_an[self.nivel][self.an] += 1

                # Print de debug pentru monitorizare
                print(f"📌 Curs sincronizat {denumire} pentru {grupe_an} → {zi}, {interval}, sala: {sala}")

        # === ETAPA 2: Generare activități practice (doar pentru cursurile deja generate) ===
        for prof in profesori:
            # Grupăm disciplinele profesorului după denumire
            discipline_grupate = defaultdict(list)
            for disc in prof["discipline"]:
                discipline_grupate[disc["denumire"]].append(disc)

            for denumire, variante in discipline_grupate.items():
                # Calculăm acronimul disciplinei (ex: "Baze de date" -> "bd")
                acronim = ''.join([w[0] for w in denumire.split()]).lower()

                # ⚠️ Dacă nu există deja cursul generat pentru această disciplină, sărim
                if (denumire.lower(), acronim.lower()) not in cursuri_generate:
                    continue

                # Extragem tipurile disponibile pentru disciplină (ex: curs, laborator, proiect...)
                tipuri = [d["tip"].lower() for d in variante]
                tipuri_unice = set(tipuri)
                profesor = prof["nume"]

                # Prefixurile grupelor (ex: "LI1", "LI2") pentru a grupa pe an/grupă
                prefixuri_grupe = set(g[:-1] for g in self.grupe if len(g) >= 3)

                # Iterăm prin tipurile de activități practice posibile
                for tip_activitate in ["proiect", "laborator", "seminar"]:
                    if tip_activitate not in tipuri_unice:
                        continue

                    # === Proiecte ===
                    if tip_activitate == "proiect":
                        for prefix in prefixuri_grupe:
                            grupe_grupa = [g for g in self.grupe if g.startswith(prefix)]

                            # Limităm la maxim 3 proiecte pe an
                            if proiecte_per_an[self.nivel][self.an] >= 3:
                                break

                            # Verificăm să nu existe deja proiectul programat
                            if any(
                                acronim.upper() in v.get("activitate", "") and v.get("tip", "").lower() == "proiect"
                                for g in grupe_grupa
                                for zi in orar[self.nivel][g].values()
                                for v in zi.values()
                            ):
                                continue

                            # Căutăm o zi și un interval valid pentru proiect
                            for zi_p in self.zile:
                                for interval_p in self.intervale:
                                    if zi_p == "Miercuri" and interval_p == "14:00-16:00":
                                        continue
                                    if interval_p not in prof.get("disponibilitate_parsata", {}).get(zi_p, []):
                                        continue
                                    if any(interval_p in orar[self.nivel][g].get(zi_p, {}) for g in grupe_grupa):
                                        continue

                                    # Găsim o sală liberă pentru proiect (prefix "GP")
                                    sala_p = None
                                    for s in self._get_sali_tip("GP"):
                                        key_p = f"{zi_p}-{interval_p}"
                                        if s not in used_slots["sali"][key_p] and profesor not in used_slots["profesori"][key_p]:
                                            sala_p = s
                                            used_slots["sali"][key_p].add(sala_p)
                                            used_slots["profesori"][key_p].add(profesor)
                                            break

                                    # Verificăm să nu fie deja prea plină ziua respectivă
                                    if any(len(orar[self.nivel][g].get(zi_p, {})) >= max_pe_zi for g in grupe_grupa):
                                        continue

                                    if sala_p:
                                        # Alocăm proiectul simultan pentru toate grupele grupate
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

                    # === Laboratoare ===
                    elif tip_activitate == "laborator":
                        # Parcurgem fiecare grupă individual
                        for grupa in self.grupe:
                            # Iterăm prin toate zilele săptămânii
                            for zi_l in self.zile:
                                # Iterăm prin toate intervalele orare disponibile
                                for interval_l in self.intervale:
                                    # Verificăm regula: miercuri între 14:00-16:00 să fie liber
                                    if zi_l == "Miercuri" and interval_l == "14:00-16:00":
                                        continue

                                    # Verificăm disponibilitatea profesorului în ziua și intervalul curent
                                    if interval_l not in prof.get("disponibilitate_parsata", {}).get(zi_l, []):
                                        continue

                                    # Evităm suprapunerea pe același interval în cadrul aceleași grupe
                                    if interval_l in orar[self.nivel][grupa].get(zi_l, {}):
                                        continue

                                    # Căutăm o sală disponibilă pentru laborator (prefix "GL")
                                    sala_l = None
                                    for s in self._get_sali_tip("GL"):
                                        key_l = f"{zi_l}-{interval_l}"
                                        if s not in used_slots["sali"][key_l] and profesor not in used_slots["profesori"][key_l]:
                                            sala_l = s
                                            # Marcam sala și profesorul ca ocupați în acel interval
                                            used_slots["sali"][key_l].add(sala_l)
                                            used_slots["profesori"][key_l].add(profesor)
                                            break

                                    # Verificăm să nu depășim numărul maxim de activități pe zi
                                    if len(orar[self.nivel][grupa].get(zi_l, {})) >= max_pe_zi:
                                        continue

                                    # Dacă am găsit o sală disponibilă, adăugăm laboratorul în orar
                                    if sala_l:
                                        orar[self.nivel][grupa].setdefault(zi_l, {})[interval_l] = {
                                            "activitate": acronim.upper(),
                                            "tip": "Laborator",
                                            "profesor": profesor,
                                            "sala": sala_l
                                        }
                                        print(f"📗 Laborator {acronim.upper()} → grupa {grupa} → {zi_l} {interval_l} {sala_l}")
                                        break  # Am programat laboratorul pentru această grupă, ieșim din intervale
                                else:
                                    continue  # continuă la următoarea zi dacă nu a găsit nimic în intervale
                                break  # dacă a găsit și a plasat deja laboratorul, trece la următoarea grupă

                    # === Seminare ===
                    elif tip_activitate == "seminar":
                        # Pentru fiecare prefix de grupă (ex: "LI1"), considerăm toate grupele aferente (LI1a, LI1b etc.)
                        for prefix in prefixuri_grupe:
                            grupe_grupa = [g for g in self.grupe if g.startswith(prefix)]

                            # Iterăm prin toate zilele săptămânii
                            for zi_s in self.zile:
                                # Iterăm prin toate intervalele orare disponibile
                                for interval_s in self.intervale:
                                    # Respectăm regula: miercuri 14:00-16:00 trebuie să fie liber
                                    if zi_s == "Miercuri" and interval_s == "14:00-16:00":
                                        continue

                                    # Verificăm disponibilitatea profesorului în acel interval
                                    if interval_s not in prof.get("disponibilitate_parsata", {}).get(zi_s, []):
                                        continue

                                    # Verificăm să nu existe deja alt seminar în acel interval pe vreo grupă
                                    if any(interval_s in orar[self.nivel][g].get(zi_s, {}) for g in grupe_grupa):
                                        continue

                                    # Căutăm o sală de seminar disponibilă (prefix "GS")
                                    sala_s = None
                                    for s in self._get_sali_tip("GS"):
                                        key_s = f"{zi_s}-{interval_s}"
                                        if s not in used_slots["sali"][key_s] and profesor not in used_slots["profesori"][key_s]:
                                            sala_s = s
                                            # Marcam sala și profesorul ca ocupați
                                            used_slots["sali"][key_s].add(sala_s)
                                            used_slots["profesori"][key_s].add(profesor)
                                            break

                                    # Ne asigurăm că nu depășim limita maximă de activități pe zi
                                    if any(len(orar[self.nivel][g].get(zi_s, {})) >= max_pe_zi for g in grupe_grupa):
                                        continue

                                    # Dacă am găsit o sală, programăm seminarul sincronizat pentru toate grupele
                                    if sala_s:
                                        for g in grupe_grupa:
                                            orar[self.nivel][g].setdefault(zi_s, {})[interval_s] = {
                                                "activitate": acronim.upper(),
                                                "tip": "Seminar",
                                                "profesor": profesor,
                                                "sala": sala_s
                                            }
                                        # Print de debug pentru monitorizare
                                        print(f"📘 Seminar {acronim.upper()} sincronizat pentru {grupe_grupa} → {zi_s} {interval_s} {sala_s}")
                                        break  # am plasat, ieșim din intervale
                                else:
                                    continue  # continuă cu următoarea zi dacă nu a plasat
                                break  # dacă a plasat deja, ieșim și mergem la următorul prefix

        # 🔍 Validări și final

        # Generează un mic raport cu numărul de activități pe zi și tipurile lipsă
        self._raport_validare(orar)

        # Echilibrează activitățile astfel încât să nu fie zile prea goale sau prea pline
        self._echilibrare_activitati_pe_zi(orar)

        # Verifică dacă există pauze mai mari de un interval (ex: să nu ai gol între 10-12 și 14-16)
        self._verifica_pauze(orar)

        # Rulează validatorul extern pentru a verifica sincronizarea cursurilor
        validator = ValidatorOrar(
            nivel=self.nivel,
            grupe=self.grupe,
            zile=self.zile,
            intervale=self.intervale
        )
        validator.valideaza_cursuri_sincronizate(orar)
        # 🔄 Postprocesare: completăm toate sloturile cu dict gol
        for grupa in self.grupe:
            for zi in self.zile:
                orar[self.nivel][grupa].setdefault(zi, {})
                for interval in self.intervale:
                    orar[self.nivel][grupa][zi].setdefault(interval, {})

        # Returnează orarul complet generat (sub formă de nested dict)
        return orar


    def _echilibrare_activitati_pe_zi(self, orar):
        print("\n🔄 ECHILIBRARE activități / zi")

        # Stabilim limitele minime și maxime pe zi, în funcție de nivel
        if self.nivel.lower() == "master":
            min_pe_zi = 2  # minim 2 activități pe zi pentru master
            max_pe_zi = 2  # maxim 2 activități pe zi pentru master
        else:
            min_pe_zi = 3  # minim 3 activități pe zi pentru licență (aprox. 6 ore)
            max_pe_zi = 4  # maxim 4 activități pe zi pentru licență (8 ore)

        # Parcurgem fiecare grupă și echilibrăm activitățile pe zile
        for grupa in self.grupe:
            zi_ore = defaultdict(int)
            activitati_grupa = orar[self.nivel][grupa]

            # Numărăm câte activități are fiecare zi pentru această grupă
            for zi in self.zile:
                zi_ore[zi] = len(activitati_grupa.get(zi, {}))

            # Parcurgem zilele și căutăm zile sub încărcate (sub minim)
            for zi in self.zile:
                if zi_ore[zi] >= min_pe_zi:
                    continue  # ziua e deja ok, trecem mai departe

                # Căutăm o zi cu prea multe activități, să mutăm de acolo
                for zi_din in sorted(self.zile, key=lambda z: zi_ore[z], reverse=True):
                    if zi_ore[zi_din] > max_pe_zi:
                        activitati_din = activitati_grupa.get(zi_din, {})
                        if not activitati_din:
                            continue

                        # Luăm prima activitate din ziua suprapopulată
                        interval_de_mutat = next(iter(activitati_din))
                        activ_mutata = activitati_din.pop(interval_de_mutat)

                        # Căutăm un interval liber în ziua subpopulată
                        for interval in self.intervale:
                            if interval not in activitati_grupa.get(zi, {}):
                                # Mutăm activitatea aici
                                activitati_grupa.setdefault(zi, {})[interval] = activ_mutata
                                print(f"♻️ Mutat activitate '{activ_mutata['tip']}' din {zi_din} {interval_de_mutat} -> {zi} {interval} (grupa {grupa})")
                                # Actualizăm numărătoarea activităților pe zi
                                zi_ore[zi_din] -= 1
                                zi_ore[zi] += 1
                                break  # o mutare per zi e suficientă
                        break  # ieșim după o mutare pentru această zi subîncărcată


    def _get_grupe(self):
        # 🔍 Executăm un SELECT în tabela 'grupe' pentru nivelul și anul curent
        self.cursor.execute(
            "SELECT * FROM grupe WHERE nivel = %s AND an = %s", 
            (self.nivel, self.an)
        )

        # Preluăm toate rezultatele sub formă de listă de dicționare
        rezultate = self.cursor.fetchall()

        # Afișăm în consolă toate grupele încărcate pentru debug
        print("\n👥 GRUPE DIN BAZA DE DATE:")
        for g in rezultate:
            print(g)

        # Returnăm doar lista denumirilor grupelor (ex: ["LI1a", "LI1b"])
        # presupunând că în tabela grupe există o coloană numită „denumire”
        return [g["denumire"] for g in rezultate]


    def _prefix_grupa(self):
        # Returnează un prefix format din prima literă a nivelului și anul
        return f"{self.nivel[0]}{self.an}"


    def _get_profesori(self):
        # 🔍 Selectăm toți profesorii din tabelul 'profesori'
        self.cursor.execute("SELECT * FROM profesori")
        profesori = self.cursor.fetchall()
        print("\n🧑‍🏫 PROFESORI DIN BAZA DE DATE:")
        for p in profesori:
            print(p)

        # 🔍 Selectăm toate disciplinele asociate profesorilor
        self.cursor.execute("SELECT * FROM discipline_profesori")
        discipline = self.cursor.fetchall()
        print("\n📚 DISCIPLINE ASOCIATE PROFESORI:")
        for d in discipline:
            print(d)

        prof_map = []

        # 🔀 Amestecăm lista totală de profesori pentru a introduce variabilitate
        random.shuffle(profesori)

        # Procesăm fiecare profesor
        for prof in profesori:
            # Filtrăm disciplinele relevante pentru profesor, doar pentru nivelul curent
            disc_tot = [
                d for d in discipline 
                if d["profesor_id"] == prof["id"] and d["nivel"] == self.nivel
            ]
            random.shuffle(disc_tot)

            # Alegem între 3 și maxim 8 discipline (sau câte sunt disponibile)
            if len(disc_tot) >= 3:
                nr_discipline = random.randint(3, min(8, len(disc_tot)))
                disc = disc_tot[:nr_discipline]
            else:
                disc = disc_tot

            # Dacă nu are discipline relevante pentru nivel, îl sărim
            if not disc:
                continue

            # Parsăm disponibilitatea profesorului, care e salvată în DB ca JSON
            disponibilitate = prof.get("disponibilitate", "{}")
            try:
                import json
                disponibilitate = json.loads(disponibilitate)
            except Exception:
                disponibilitate = {}

            # Adăugăm profesorul în lista finală, cu disciplinele și disponibilitatea parse
            prof_map.append({
                **prof,
                "discipline": disc,
                "disponibilitate_parsata": disponibilitate
            })

        # 🎯 Alegem aleator între 8 și 10 profesori pentru generarea orarului
        nr_profesori = random.randint(8, min(10, len(prof_map)))
        prof_map = prof_map[:nr_profesori]

        # Afișăm în consolă profesorii aleși și disciplinele lor
        print("\n🔍 PROFESORI ALEȘI LA GENERARE:")
        for p in prof_map:
            print(f"{p['nume']} → {[d['denumire'] for d in p['discipline']]}")

        # Returnăm lista finală cu profesori, discipline și disponibilitate
        return prof_map

    def _get_sali(self):
        # 🔍 Selectează toate sălile din tabela 'sali'
        self.cursor.execute("SELECT * FROM sali")
        # Returnează rezultatul sub formă de listă de dicționare (datorită dictionary=True)
        return self.cursor.fetchall()

    def _get_sali_tip(self, prefix):
        # 🔍 Returnează doar codurile sălilor care încep cu un anumit prefix
        # ex: "GC" pentru cursuri, "GL" pentru laboratoare, "GS" pentru seminare, "GP" pentru proiecte
        return [s["cod"] for s in self._get_sali() if s["cod"].startswith(prefix)]

    def _get_discipline(self):
        # 🔍 Selectează toate disciplinele asociate profesorilor pentru nivelul curent (ex: Licență)
        self.cursor.execute("SELECT * FROM discipline_profesori WHERE nivel = %s", (self.nivel,))
        discipline = self.cursor.fetchall()

        # 🔀 Amestecăm lista pentru diversitate (randomizare ordinii)
        random.shuffle(discipline)

        # Returnăm lista completă de discipline
        return discipline

    def _slot_valid(self, prefix, used_slots, profesor=None, disponibilitate=None):
        # 🔍 În funcție de nivel, stabilim intervalele orare permise
        # masterul are doar după-amiaza și seara
        if self.nivel.lower() == "master":
            intervale_permise = ["16:00-18:00", "18:00-20:00"]
        else:
            intervale_permise = self.intervale

        # Dacă nu s-a transmis disponibilitatea explicit, presupunem că profesorul e disponibil mereu
        if disponibilitate is None:
            disponibilitate = {zi: intervale_permise for zi in self.zile}

        # Calculăm cât de încărcată este fiecare zi (număr de săli ocupate)
        zi_load = {
            zi: sum(len(used_slots["sali"][f"{zi}-{intv}"]) for intv in intervale_permise)
            for zi in self.zile
        }

        # Ordonăm zilele începând cu cea mai liberă
        zile_ordonate = sorted(self.zile, key=lambda z: zi_load[z])

        # Căutăm un slot valid
        for zi in zile_ordonate:
            for interval in intervale_permise:
                # Sărim peste miercuri 14-16 conform regulilor stabilite
                if zi == "Miercuri" and interval == "14:00-16:00":
                    continue

                # Verificăm disponibilitatea profesorului în ziua și intervalul curent
                if interval not in disponibilitate.get(zi, []):
                    continue

                # Obținem lista sălilor disponibile pentru acest tip (ex: GC pentru cursuri)
                sali_disponibile = self._get_sali_tip(prefix)
                random.shuffle(sali_disponibile)  # amestecăm pentru a nu lua mereu aceeași sală

                for sala in sali_disponibile:
                    key = f"{zi}-{interval}"
                    # Verificăm dacă sala și profesorul nu sunt deja ocupați în acest slot
                    if (
                        sala not in used_slots["sali"][key]
                        and (not profesor or profesor not in used_slots["profesori"][key])
                    ):
                        # Marcăm sala și profesorul ca ocupați
                        used_slots["sali"][key].add(sala)
                        if profesor:
                            used_slots["profesori"][key].add(profesor)
                        # Returnăm slotul valid găsit
                        return zi, interval, sala

        # Dacă nu găsește un slot valid, returnează fallback
        return "Luni", "08:00-10:00", "FaraSala"

    def _verifica_pauze(self, orar):
        # Iterăm prin toate grupele generate
        for grupa in self.grupe:
            # Parcurgem zilele săptămânii
            for zi in self.zile:
                # Obținem lista intervalelor orare programate în acea zi, sortată cronologic
                sloturi = sorted(orar[self.nivel][grupa].get(zi, {}).keys())

                # Dacă nu sunt activități în ziua respectivă, trecem mai departe
                if not sloturi:
                    continue

                # Verificăm dacă există pauze mari între activități
                for i in range(len(sloturi) - 1):
                    # Identificăm poziția fiecărui interval în lista completă de intervale
                    ora1 = self.intervale.index(sloturi[i])
                    ora2 = self.intervale.index(sloturi[i + 1])

                    # Dacă diferența dintre poziții este mai mare decât 1, înseamnă că există o pauză
                    if ora2 - ora1 > 1:
                        print(f"⚠️ Pauză mare între {sloturi[i]} și {sloturi[i+1]} pentru {grupa} în {zi}")


    def _raport_validare(self, orar):
        print("\n📋 RAPORT VALIDARE ORAR")

        # Parcurgem fiecare grupă generată
        for grupa in self.grupe:
            tipuri = set()             # ținem evidența tipurilor de activități (curs, seminar, etc.)
            total = 0                  # contor pentru numărul total de activități
            zi_ore = defaultdict(int)  # dicționar pentru numărul activităților pe zi

            # Parcurgem toate zilele săptămânii
            for zi in self.zile:
                activitati = orar[self.nivel][grupa].get(zi, {})
                for interval, activ in activitati.items():
                    tipuri.add(activ.get("tip", "").lower())  # colectăm tipul activității
                    total += 1
                    zi_ore[zi] += 1

            # Printăm un sumar pentru grupa respectivă
            print(f"\n📘 Grupa: {grupa}")
            print(f"🕒 Total activități: {total}")

            # Verificăm dacă lipsesc tipuri importante de activități
            if "curs" not in tipuri:
                print("❌ Lipsă: Curs")
            if "seminar" not in tipuri:
                print("❌ Lipsă: Seminar")
            if "laborator" not in tipuri:
                print("❌ Lipsă: Laborator")
            if "proiect" not in tipuri:
                print("❌ Lipsă: Proiect")

            # Verificăm dacă respectăm limitele minime și maxime pe zi
            for zi, nr in zi_ore.items():
                if self.nivel.lower() == "master":
                    if nr > 2:
                        print(f"⚠️ {zi} are {nr} activități (maxim admis pentru master: 2)")
                else:
                    if nr < 3:
                        print(f"⚠️ {zi} are doar {nr} activități (minim necesar pentru licență: 3)")
                    if nr > 4:
                        print(f"⚠️ {zi} are {nr} activități (maxim admis pentru licență: 4)")
