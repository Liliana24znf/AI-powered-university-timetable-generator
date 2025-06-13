import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";

const useGeneratedTimetable = () => {
  const [orar, setOrar] = useState(null);
  const [loadingGPT, setLoadingGPT] = useState(false);
  const [loadingClasic, setLoadingClasic] = useState(false);
  const [cautareOrar, setCautareOrar] = useState("");

  const [profesori, setProfesori] = useState([]);
  const [sali, setSali] = useState([]);
  const [grupe, setGrupe] = useState([]);
  const location = useLocation();
  const {
  regula_id,
  denumire: denumireRegulaSelectata,
  continut: continutRegula,
  orar_id_selectat, // 👈 Adaugă acest rând
} = location.state || {};

const [nivelSelectat, setNivelSelectat] = useState("Licenta");
const [orareSalvate, setOrareSalvate] = useState([]);
const [esteOrarSalvat, setEsteOrarSalvat] = useState(false);

  const [anSelectat, setAnSelectat] = useState("");
const [raportValidare, setRaportValidare] = useState("");


  const handleLogout = () => {
    localStorage.removeItem("user"); // sau orice cheie folosești
    navigate("/"); // redirecționează către homepage
  };

const [user, setUser] = useState(null);

useEffect(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    setUser(JSON.parse(storedUser));
  }
}, []);
useEffect(() => {
  const incarcaTot = async () => {
    try {
      const resDate = await fetch("http://localhost:5000/date_orar");
      const data = await resDate.json();

      const discipline = data.discipline || [];

      // Leagă disciplinele de profesori
      const profesoriCuDiscipline = (data.profesori || []).map((prof) => {
        const disciplineProf = discipline
          .filter((d) => d.profesor_id === prof.id)
          .map((d) => `${d.denumire} (${d.nivel}, ${d.tip})`)

        return { ...prof, discipline: disciplineProf };
      });

      setProfesori(profesoriCuDiscipline);
      setSali(data.sali || []);
      setGrupe(data.grupe || []);
      setReguli(data.reguli?.continut || "");

      if ((data.grupe || []).length > 0 && !anSelectat) {
        const ani = Array.from(new Set(data.grupe.map((g) => g.an))).sort();
        setAnSelectat(ani[0]);
      }

      const resOrare = await fetch("http://localhost:5000/orare_generate");
      const orare = await resOrare.json();
      setOrareSalvate(orare);
    } catch (err) {
      console.error("Eroare la încărcarea datelor:", err);
    }
  };

  incarcaTot();
}, []);



const [reguli, setReguli] = useState("");

useEffect(() => {
  if (continutRegula) {
    setReguli(continutRegula);
  }
}, [continutRegula]);



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
  ✅ cel puțin 1 Curs (cu anul)  
  ✅ cel puțin 1 Seminar (cu grupa)  
  ✅ cel puțin 1 Proiect (cu grupa)  
  ✅ cel puțin 1 Laborator (cu subgrupa)
- Distribuie activitățile uniform pe parcursul săptămânii (Luni–Vineri).
- Respectă regula de 4–8 ore/zi pentru fiecare grupă.
- Grupele pot avea un număr diferit de activități zilnic, dar NU se suprapun.

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

    setEsteOrarSalvat(false); // 👈 dezactivează indicatorul

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
      setEsteOrarSalvat(false);

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


const exportExcel = () => {
  if (!orar) return;

  const wb = XLSX.utils.book_new();
  const zileOrdine = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];

  for (const nivel in orar) {
    for (const grupa in orar[nivel]) {
      const data = [];

      for (const zi of zileOrdine) {
        const activitati = orar[nivel][grupa][zi];
        if (!activitati) continue;

        const intervaleSortate = Object.keys(activitati).sort();

        for (const interval of intervaleSortate) {
          const item = activitati[interval];

          data.push({
            Nivel: nivel,
            Grupa: grupa,
            Zi: zi,
            Interval: interval,
            Disciplina: item?.activitate || "",
            Tip: item?.tip || "",
            Profesor: item?.profesor || "",
            Sala: item?.sala || ""
          });
        }
      }

      const ws = XLSX.utils.json_to_sheet(data);

      // ✅ Setează lățimi pentru coloane
      ws['!cols'] = [
        { wch: 10 },  // Nivel
        { wch: 12 },  // Grupa
        { wch: 10 },  // Zi
        { wch: 15 },  // Interval
        { wch: 30 },  // Disciplina
        { wch: 15 },  // Tip
        { wch: 25 },  // Profesor
        { wch: 10 }   // Sala
      ];

      // ✅ Adaugă sheet în workbook
      XLSX.utils.book_append_sheet(wb, ws, `${nivel}-${grupa}`);
    }
  }

  // ✅ Salvează fișierul Excel
  XLSX.writeFile(wb, "orar.xlsx");
};


const exportPDF = () => {
  if (!orar) return;
  const element = document.getElementById("orar-afisat");

  const optiuni = {
    margin: [8.5, 8.5, 8.5, 8.5],
    filename: "orar.pdf",
    image: { type: "jpeg", quality: 1 },
    html2canvas: {
      scale: 8.5,
      useCORS: true,
      scrollY: 0
    },
    jsPDF: {
      unit: "mm",
      format: "a4", // A3 pentru lățime mai mare
      orientation: "landscape"
    },
    pagebreak: {
      mode: ["avoid-all", "css", "legacy"]
    }
  };

  html2pdf()
    .set(optiuni)
    .from(element)
    .save();
};








const aniDisponibili = Array.from(
  new Set(grupe.filter(g => g.nivel === nivelSelectat).map((g) => g.an))
).sort();


useEffect(() => {
  if (orar_id_selectat) {
    incarcaOrarSalvat(orar_id_selectat);
  }
}, [orar_id_selectat]);



const incarcaOrarSalvat = async (id) => {
  try {
    const r = await fetch(`http://localhost:5000/orar_generat/${id}`);
    const json = await r.json();
    console.log("Orar salvat încărcat:", json);
    setOrar(json);
    valideazaOrarGenerat(json);
    setEsteOrarSalvat(true);

    const nivel = Object.keys(json)[0];
    const grupa = Object.keys(json[nivel])[0];
    const grupaGasita = grupe.find((g) => g.denumire === grupa);
    if (grupaGasita) {
      setNivelSelectat(nivel);
      setAnSelectat(grupaGasita.an);
    }
  } catch (err) {
    console.error("Eroare la încărcare orar:", err);
  }
};



const stergeOrar = async (id) => {
  if (!window.confirm("Sigur dorești să ștergi acest orar?")) return;

  try {
    const res = await fetch(`http://localhost:5000/sterge_orar/${id}`, {
      method: "DELETE"
    });

    const result = await res.json();

    if (result.success) {
      setOrareSalvate((prev) => prev.filter((o) => o.id !== id));
      if (orar_id_selectat === id) {
        setOrar(null);
        setEsteOrarSalvat(false);
      }
    } else {
      alert("Eroare la ștergere: " + result.error);
    }
  } catch (err) {
    console.error("Eroare la ștergere orar:", err);
    alert("A apărut o eroare la ștergere.");
  }
};

const editeazaDenumire = async (id, numeCurent) => {
  const { value: nouNume } = await Swal.fire({
    title: "Editează denumirea orarului",
    input: "text",
    inputLabel: "Noua denumire",
    inputValue: numeCurent || "",
    showCancelButton: true,
    confirmButtonText: "Salvează",
    cancelButtonText: "Renunță",
  });

  if (nouNume && nouNume.trim()) {
    try {
      const r = await fetch(`http://localhost:5000/editeaza_orar/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nume: nouNume }),
      });
      const json = await r.json();

      if (json.success) {
  Swal.fire("✅ Salvare reușită", "", "success");
  setOrareSalvate((prev) =>
    prev.map((o) => (o.id === id ? { ...o, nume: nouNume } : o))
  );
}
 else {
        Swal.fire("Eroare la salvare", json.error || "", "error");
      }
    } catch (err) {
      Swal.fire("Eroare de rețea", err.message, "error");
    }
  }
};



const valideazaOrarGenerat = (orarGenerat) => {
  const cursuriProblema = [];
  const lipsuri = [];
  let totalActivitati = 0;
  let activitatiCorecte = 0;
  let laboratoareValide = 0;
  let laboratoareTotale = 0;

  const grupeAnCurent = grupe.filter(
    (g) => g.nivel === nivelSelectat && g.an === anSelectat
  );


  const activitatiDeSincronizat = {
    curs: {},
    seminar: {},
    proiect: {},
  };

  const capitalize = (str) =>
    str.split(" ").map(s => s[0]?.toUpperCase() + s.slice(1)).join(" ");

  // 🧠 Colectăm cursuri, seminarii și proiecte
  grupeAnCurent.forEach((g) => {
    if (!g.grupa) {
      g.grupa = g.denumire.slice(0, -1); // deducem grupa (ex: LI1a → LI1)
    }
    const orarGrupa = orarGenerat[nivelSelectat]?.[g.denumire] || {};
    Object.entries(orarGrupa).forEach(([zi, intervale]) => {
      Object.entries(intervale).forEach(([interval, activ]) => {
        const tip = activ?.tip?.toLowerCase();
        if (!tip) return;

        totalActivitati++;
        activitatiCorecte++;

        if (["curs", "seminar", "proiect"].includes(tip)) {
          const cheie = `${activ.activitate.trim().toLowerCase()}|${activ.profesor.trim().toLowerCase()}`;
          if (!activitatiDeSincronizat[tip][cheie]) activitatiDeSincronizat[tip][cheie] = [];
          activitatiDeSincronizat[tip][cheie].push({
            grupa: g.denumire,
            grupa_logica: {
              curs: g.an,
              seminar: g.grupa,
              proiect: g.grupa
            }[tip],
            zi,
            interval,
            sala: activ.sala
          });
        }
      });
    });
  });

  // ✅ Verificare sincronizare pe an / grupă
  Object.entries(activitatiDeSincronizat).forEach(([tipActivitate, activitati]) => {
    Object.entries(activitati).forEach(([cheie, aparitii]) => {
      const [nume, prof] = cheie.split("|").map(capitalize);

      const grupate = {};

      aparitii.forEach((a) => {
        const grup = a.grupa_logica;
        if (!grupate[grup]) grupate[grup] = [];
        grupate[grup].push(a);
      });

      Object.entries(grupate).forEach(([grup, lista]) => {
        const ref = lista[0];
        const nesincronizate = lista.filter(
          (a) =>
            a.zi !== ref.zi ||
            a.interval !== ref.interval ||
            a.sala !== ref.sala
        );

        const grupeGasite = new Set(lista.map(a => a.grupa));
        const grupeCorecte = grupeAnCurent
          .filter((g) => {
            const refVal = {
              curs: g.an,
              seminar: g.grupa,
              proiect: g.grupa
            }[tipActivitate];
            return refVal === grup;
          })
          .map((g) => g.denumire);

        const grupeLipsa = grupeCorecte.filter(gr => !grupeGasite.has(gr));

        if (grupeLipsa.length > 0) {
          cursuriProblema.push(`❌ ${tipActivitate} ${nume} – ${prof} lipsește din: ${grupeLipsa.join(", ")}`);
        }

        if (nesincronizate.length > 0) {
          cursuriProblema.push(`❌ ${tipActivitate} ${nume} – ${prof} NU este sincronizat în: ${nesincronizate.map(n => n.grupa).join(", ")}`);
        }
      });
    });
  });

  // 🔍 Verificare lipsuri per grupă
  grupeAnCurent.forEach((g) => {
    const orarGrupa = orarGenerat[nivelSelectat]?.[g.denumire] || {};
    const tipuriGasite = new Set();

    Object.values(orarGrupa).forEach((intervale) => {
      Object.values(intervale).forEach((activ) => {
        if (activ?.tip) {
          tipuriGasite.add(activ.tip.toLowerCase());
        }
      });
    });

    const necesare = ["curs", "seminar", "proiect", "laborator"];
    necesare.forEach((t) => {
      if (!tipuriGasite.has(t)) {
        lipsuri.push(`❌ Grupa ${g.denumire} nu are activitate de tip ${t}`);
      }
    });
  });

  // ✅ Verificare suprapuneri laboratoare
  const eroriLaboratoare = [];
  const subgrupeLaborator = grupeAnCurent.filter(g => g.subgrupa);
  const sloturiLaborator = {};

  subgrupeLaborator.forEach((g) => {
    const orarGrupa = orarGenerat[nivelSelectat]?.[g.denumire] || {};
    Object.entries(orarGrupa).forEach(([zi, intervale]) => {
      Object.entries(intervale).forEach(([interval, activ]) => {
        if (activ?.tip?.toLowerCase() === "laborator") {
          const cheie = `${activ.activitate}|${activ.profesor}`.toLowerCase();
          if (!sloturiLaborator[cheie]) sloturiLaborator[cheie] = [];
          sloturiLaborator[cheie].push({
            grupa: g.denumire,
            zi,
            interval,
            sala: activ.sala
          });
        }
      });
    });
  });

  Object.entries(sloturiLaborator).forEach(([cheie, aparitii]) => {
    laboratoareTotale += aparitii.length;
    const combinatiiUnice = new Set(aparitii.map(a => `${a.zi}-${a.interval}`));

    if (combinatiiUnice.size === aparitii.length) {
      laboratoareValide += aparitii.length;
    } else {
      const grupeConflict = aparitii.map(a => a.grupa).join(", ");
      const [disciplina, prof] = cheie.split("|").map(capitalize);
      eroriLaboratoare.push(`❌ Laboratorul ${disciplina} – ${prof} este programat simultan pentru: ${grupeConflict}`);
    }
  });


  // ✅ Verificare suprapuneri și duplicări pentru curs/seminar/proiect
const eroriActivitati = {
  seminar: [],
  proiect: []
};

[ "seminar", "proiect"].forEach((tipActivitate) => {
  const sloturi = {};

  Object.entries(activitatiDeSincronizat[tipActivitate] || {}).forEach(([cheie, aparitii]) => {
    aparitii.forEach((a) => {
      const grupCheie = {
        seminar: grupe.find(g => g.denumire === a.grupa).grupa,
        proiect: grupe.find(g => g.denumire === a.grupa).grupa
      }[tipActivitate];

      const slot = `${grupCheie}|${a.zi}|${a.interval}`;
      const fullCheie = `${cheie}|${slot}`;

      if (!sloturi[fullCheie]) sloturi[fullCheie] = [];
      sloturi[fullCheie].push(a.grupa);
    });
  });

  Object.entries(sloturi).forEach(([fullCheie, grupeGasite]) => {
    if (grupeGasite.length > 1) {
      const [activitate, profesor, grup, zi, interval] = fullCheie.split("|").map(capitalize);
      eroriActivitati[tipActivitate].push(`❌ ${tipActivitate} ${activitate} – ${profesor} apare simultan la mai multe grupe (${grupeGasite.join(", ")}) în ${zi}, ${interval}`);
    }
  });
});


  // 📊 Rezultat final
// ⚠️ Considerăm activități invalide dacă există orice erori
const areErori = cursuriProblema.length > 0 || eroriLaboratoare.length > 0 || lipsuri.length > 0;

const totalActivitatiFinal = totalActivitati + laboratoareTotale;
let activitatiCorecteFinal = activitatiCorecte + laboratoareValide;

// Dacă există erori semnificative, nu putem spune că sunt toate valide
if (areErori) {
  activitatiCorecteFinal -= (cursuriProblema.length + eroriLaboratoare.length + lipsuri.length);

  // Prevenim rezultat negativ
  if (activitatiCorecteFinal < 0) {
    activitatiCorecteFinal = 0;
  }
}


const procent = totalActivitatiFinal > 0
  ? Math.round((activitatiCorecteFinal / totalActivitatiFinal) * 100)
  : 0;


  let mesaj = `📊 Acuratețe estimată: ${procent}% (${activitatiCorecteFinal} / ${totalActivitatiFinal} activități valide)\n\n`;

  mesaj += `📘 Verificare sincronizare:\n${
    cursuriProblema.length === 0
      ? "✅ Cursuri, seminare și proiecte sunt sincronizate"
      : cursuriProblema.join("\n")
  }\n\n`;

mesaj += `📚 Verificare seminarii/laboratoare:\n`;

[ "seminar", "proiect"].forEach((tip) => {
  mesaj += eroriActivitati[tip].length === 0
    ? `✅ Nicio problemă la ${tip}e\n\n`
    : eroriActivitati[tip].join("\n") 
});


  mesaj += `🧪 Verificare laboratoare:\n${
    eroriLaboratoare.length === 0
      ? "✅ Laboratoarele sunt distribuite corect între subgrupe"
      : eroriLaboratoare.join("\n")
  }\n\n`;

  mesaj += `📋 Verificare completitudine:\n${
    lipsuri.length === 0
      ? "✅ Toate grupele au cele 4 tipuri de activități"
      : lipsuri.join("\n")
  }`;

  setRaportValidare(mesaj.trim());

  return {
    procent,
    mesaj: mesaj.trim(),
    erori: {
      cursuriProblema,
      eroriLaboratoare,
      lipsuri
    }
  };
};



const orareFiltrate = orareSalvate.filter((orar) =>
  (orar.nume || `${orar.nivel} – ${orar.an}`)
    .toLowerCase()
    .includes(cautareOrar.toLowerCase())
);

  return {
    user,
    orar,
    nivelSelectat,
    anSelectat,
    raportValidare,
    loadingGPT,
    loadingClasic,
    orareFiltrate,
    aniDisponibili,
    regula_id,
    continutRegula,
    denumireRegulaSelectata,
    genereazaOrar,
    genereazaOrarClasic,
    exportExcel,
    exportPDF,
    handleLogout,
    incarcaOrarSalvat,
    stergeOrar,
    editeazaDenumire,
    setNivelSelectat,
    setAnSelectat,
    setCautareOrar,
    cautareOrar
  };
};

export default useGeneratedTimetable;
