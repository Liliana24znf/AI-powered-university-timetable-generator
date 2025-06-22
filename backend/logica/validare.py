from collections import defaultdict

class ValidatorOrar:
    def __init__(self, nivel, grupe, zile, intervale):
        self.nivel = nivel
        self.grupe = grupe
        self.zile = zile
        self.intervale = intervale

    def valideaza_cursuri_sincronizate(self, orar):
        print("\n🧪 VALIDARE CURSURI SINCRONIZATE PE AN")
        if self.nivel.lower() == "master":
            min_pe_zi = 1
            max_pe_zi = 2
        else:
            min_pe_zi = 3  # echivalent cu 6 ore
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


def valideaza_orar(orar):
    raport_text = "\n📋 Raport de validare orar:\n"
    raport_html = "<div class='card mt-4'><div class='card-header bg-warning text-dark fw-bold'>📋 Raport de validare orar</div><div class='card-body'><ul class='list-group'>"

    for grupa, zile in orar.items():
        raport_text += f"🔎 Grupa: {grupa}\n"
        raport_html += f"<li class='list-group-item'><strong>🔎 Grupa: {grupa}</strong><ul>"

        pentru_grupa_valida = True

        for zi, intervale in zile.items():
            activitati = [val for val in intervale.values() if val and "Pauză" not in val]
            total_ore = len(activitati) * 2

            if not activitati:
                raport_text += f"   ❌ {zi} este complet goală!\n"
                raport_html += f"<li>❌ <strong>{zi}</strong> este complet goală!</li>"
                pentru_grupa_valida = False
                continue

            if total_ore < 4:
                raport_text += f"   ⚠️ {zi} are doar {total_ore} ore (minim 4h necesare)\n"
                raport_html += f"<li>⚠️ {zi} are doar {total_ore} ore (minim 4h)</li>"

            for interval, activitate in intervale.items():
                if "Niciun profesor disponibil" in activitate:
                    raport_text += f"   ❌ {zi} {interval}: Niciun profesor disponibil\n"
                    raport_html += f"<li>❌ {zi} {interval}: Niciun profesor disponibil</li>"
                    pentru_grupa_valida = False
                if "Fără sală" in activitate:
                    raport_text += f"   ❌ {zi} {interval}: Fără sală disponibilă\n"
                    raport_html += f"<li>❌ {zi} {interval}: Fără sală disponibilă</li>"
                    pentru_grupa_valida = False

        if pentru_grupa_valida:
            raport_text += "   ✅ Orar valid ✅\n"
            raport_html += "<li>✅ Orar valid</li>"
        else:
            raport_html += "<li>⚠️ Probleme detectate!</li>"

        raport_html += "</ul></li>"

    raport_html += "</ul></div></div>"
    print(raport_text)
    return raport_html
