import { useState, useEffect } from "react";
import useValidareOrar from "./useValidareOrar";

const useOrarGenerator = (
  nivelSelectat,
  anSelectat,
  setOrar,
  setRaportValidare,
  regula_id,
  continutRegula,
  setEsteOrarSalvat
) => {
  const [profesori, setProfesori] = useState([]);
  const [sali, setSali] = useState([]);
  const [grupe, setGrupe] = useState([]);
  const [reguli, setReguli] = useState("");
  const [loadingGPT, setLoadingGPT] = useState(false);
  const [loadingClasic, setLoadingClasic] = useState(false);

const { valideazaOrarGenerat } = useValidareOrar(
  nivelSelectat,
  anSelectat,
  grupe,
  setRaportValidare
);


  // Încarcă toate datele inițiale
  useEffect(() => {
    const incarcaDate = async () => {
      try {
        const res = await fetch("http://localhost:5000/date_orar");
        const data = await res.json();

        const discipline = data.discipline || [];

        const profesoriCuDiscipline = (data.profesori || []).map((prof) => {
          const disciplineProf = discipline
            .filter((d) => d.profesor_id === prof.id)
            .map((d) => `${d.denumire} (${d.nivel}, ${d.tip})`);
          return { ...prof, discipline: disciplineProf };
        });

        setProfesori(profesoriCuDiscipline);
        setSali(data.sali || []);
        setGrupe(data.grupe || []);
        setReguli(data.reguli?.continut || "");
      } catch (err) {
        console.error("Eroare la încărcarea datelor:", err);
      }
    };

    incarcaDate();
  }, []);

  const genereazaOrar = async () => {
    setLoadingGPT(true);

const instructiuniProfesori = profesori.map((p) => {
  const discipline = Array.isArray(p.discipline) && p.discipline.length > 0
    ? p.discipline.join(", ")
    : "fără discipline";

  return `- ${p.nume} (${discipline})`;
}).join("\n");


const instructiuniSali = `
🏫 Săli disponibile:

Folosește EXCLUSIV codurile de săli de mai jos. NU inventa denumiri, NU modifica formatul!

${sali.map((s) => `- ${s.cod} (${s.tip})`).join("\n")}

‼️ IMPORTANT:
- NU este permis să folosești alt cod de sală decât cele din listă.
- NU folosi coduri generice (ex: A1, Sala 1, etc.) – sunt interzise!
- În orar trebuie să apară DOAR codurile exacte (ex: GC1, GS2, GL3).
`.trim();


const instructiuniGrupe = grupe
  .filter(
    (gr) =>
      gr.nivel === nivelSelectat &&
      gr.an === anSelectat
  )
  .map(
    (gr) =>
      `- ${gr.denumire} (${gr.nivel}, anul ${gr.an}, grupa ${gr.grupa}, subgrupa ${gr.subgrupa})`
  )
  .join("\n");


const instructiuniGPT = `
🔒 REGULI GPT PENTRU GENERAREA ORARULUI:

📌 Structura generală:
- NU include chei globale precum "luni", "marti" etc.
- Toate activitățile trebuie plasate DOAR în interiorul grupelor/subgrupelor, sub cheile "Licenta" și "Master".
- Grupele sunt  formatul  LI1a + LI1b + LI1c etc. pentru Licență și MA1a + MA1b etc. pentru Master.
- Subgrupelor sunt LI1a1 sau LI1a2 etc. pentru Licență și MA1a1, MA1a2 etc. pentru Master.
- Formatul JSON trebuie să respecte modelul de mai jos (NU folosi array-uri, fiecare interval este un obiect):

{
  "Licenta": {
    "LI1a": {
      "Luni": {
        "08:00–10:00": {
          "activitate": "Algoritmi (AL)",
          "tip": "Curs",
          "profesor": "Maria Ionescu",
          "sala": "GC1"
        }
      }
    }
  }
}

---

📚 1. **CURSURI (pe AN)**
- Cursurile se organizează O SINGURĂ DATĂ pentru întregul AN (ex: LI2a, LI2b, LI2c).
- Toate grupele din același an trebuie să aibă cursul în ACELAȘI MOMENT.
- Trebuie să apară:
  ✅ în ACEEAȘI ZI,  
  ✅ în ACELAȘI INTERVAL ORAR,  
  ✅ în ACEEAȘI SALĂ,  
  ✅ cu ACELAȘI PROFESOR  
  în toate grupele acelui an.
- NU genera cursuri individuale per grupă!
- Se folosesc exclusiv săli cu prefix **GC**.
- NU omite nicio grupă din an: toate trebuie să aibă TOATE cursurile comune.

🧩 2. **SEMINARE & PROIECTE (pe GRUPĂ)**
- Se organizează individual pentru fiecare grupă (ex: LI1a, LI1b).
- NU este permisă suprapunerea în același interval pentru activități cu același profesor.
- Fiecare activitate are:
  ✅ o zi,  
  ✅ un interval orar,  
  ✅ o sală.
- Seminare → prefix **GS**
- Proiecte → prefix **GP**

🧪 3. **LABORATOARE (pe SUBGRUPĂ)**
- Fiecare subgrupă are laboratorul propriu.
- Laboratoarele NU trebuie să fie în același interval orar pentru subgrupe diferite.
- Se recomandă folosirea de săli diferite.
- Prefix sală: **GL**
- NU este permisă suprapunerea dacă au același profesor sau sală.

🏛️ 4. **REGULI PENTRU SĂLI**
- O sală NU poate fi folosită simultan de mai multe activități (nici măcar la niveluri diferite).
- Sălile NU se împart între licență și master în același interval.
- Prefixe:
  - GC → Curs
  - GS → Seminar
  - GP → Proiect
  - GL → Laborator

⚠️ 5. **OBLIGAȚII FINALE**
- Fiecare grupă/subgrupă trebuie să aibă:
  ✅ Toate Cursurile cu anul  
  ✅ Toate Seminariile cu grupa  
  ✅ Toate Proiectele cu grupa 
  ✅ Laboratorele cu subgrupa(de exemplu, LI1a, LI1b, LI1c, sa aiba laboratoarele la ore diferite)
- Distribuie activitățile uniform pe parcursul săptămânii (Luni–Vineri).
- Respectă regula de 4–8 ore/zi pentru fiecare grupă.
- Grupele pot avea un număr diferit de activități zilnice.
- NU lăsa zile fără activități pentru grupe/subgrupe.
`.trim();

const promptFinal = `


🔒 GENEREAZĂ DOAR PENTRU NIVELUL: **${nivelSelectat}**, anul: **${anSelectat}**.
‼️ NU include date din alt nivel. Dacă este Master, NU include Licență.

‼️ IMPORTANT:
- Cursurile trebuie să fie IDENTICE (zi, oră, sală, profesor) pentru TOATE grupele din același an.  
- Seminarele și proiectele trebuie să fie planificate SEPARAT pentru fiecare GRUPĂ.  
- Laboratoarele trebuie să fie planificate SEPARAT pentru fiecare SUBGRUPĂ, în intervale diferite.  


✅ LISTA COMPLETĂ de profesori și discipline (nu inventa altele):
${instructiuniProfesori}

🏫 Săli disponibile:
${instructiuniSali}
🚫 NU este permis să generezi săli fictive (ex: M101, A2, B5).
✅ Folosește DOAR codurile de săli din lista transmisă. Fără excepții.

👥 Grupe selectate (${nivelSelectat}, anul ${anSelectat}):
${instructiuniGrupe}


🔒 INSTRUCȚIUNI STRICTE PENTRU GPT – FORMAT ȘI RESTRICȚII:
${instructiuniGPT}

Regula ID: ${regula_id || "N/A"}

📜 Conținutul regulii:
${continutRegula || "Nicio regulă definită"}




`;
console.log("🎯 PROMPT GPT:\n", promptFinal);

try {
  const response = await fetch("http://127.0.0.1:5000/genereaza_orar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
  regula_id: regula_id,
  an_selectat: anSelectat,
  nivel_selectat: nivelSelectat,
  grupe_selectate: grupe
    .filter(g => g.an === anSelectat && g.nivel === nivelSelectat)
    .map(g => g.denumire),
    prompt: promptFinal
}),

  });

  const data = await response.json();

  try {
    // Validare JSON (opțională)
    JSON.stringify(data);
    setOrar(data);
    valideazaOrarGenerat(data);

    //setEsteOrarSalvat(false); // 👈 dezactivează indicatorul

    // Salvează automat în baza de date
try {
  await fetch("http://127.0.0.1:5000/salveaza_orar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nivel: nivelSelectat,
      an: anSelectat,
      orar: data
    })
  });
} catch (err) {
  console.error("Eroare la salvarea orarului:", err);
}

  } catch (err) {
    console.error("Răspunsul nu este JSON valid:", err);
  }

} catch (error) {
  console.error("Eroare la generare orar:", error);
}

    setLoadingGPT(false);
  };

const genereazaOrarClasic = async () => {
  setLoadingClasic(true);
  try {
    const response = await fetch("http://127.0.0.1:5000/genereaza_algoritm_propriu", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nivel_selectat: nivelSelectat,
        an_selectat: anSelectat,
        grupe_selectate: grupe
          .filter((g) => g.nivel === nivelSelectat && g.an === anSelectat)
          .map((g) => g.denumire),
      }),
    });

    const data = await response.json();

    try {
      JSON.stringify(data);
      setOrar(data);
      valideazaOrarGenerat(data);
      //setEsteOrarSalvat(false);

      await fetch("http://127.0.0.1:5000/salveaza_orar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nivel: nivelSelectat,
          an: anSelectat,
          orar: data,
        }),
      });
    } catch (err) {
      console.error("Răspunsul nu este JSON valid:", err);
    }
  } catch (error) {
    console.error("Eroare la generare clasică:", error);
  }

  setLoadingClasic(false);
};



  return {
    profesori,
    sali,
    grupe,
    reguli,
    loadingGPT,
    loadingClasic,
    genereazaOrar,
    genereazaOrarClasic
  };
};

export default useOrarGenerator;
