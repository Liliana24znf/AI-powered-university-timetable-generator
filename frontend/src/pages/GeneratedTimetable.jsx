import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2"; // pentru prompt elegant
const GeneratedTimetable = () => {
  const [orar, setOrar] = useState(null);
  const [loading, setLoading] = useState(false);
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
const [grupaSelectata, setGrupaSelectata] = useState("");
const [raportValidare, setRaportValidare] = useState("");


const toateGrupele = nivelSelectat && orar?.[nivelSelectat]
  ? Object.keys(orar[nivelSelectat])
  : [];

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
    setLoading(true);

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

    setLoading(false);
  };


  const zileOrdine = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];

const exportExcel = () => {
  if (!orar) return;
  const wb = XLSX.utils.book_new();

  for (const nivel in orar) {
    for (const an in orar[nivel]) {
      const data = [];

      for (const zi in orar[nivel][an]) {
        const activitati = orar[nivel][an][zi];

        for (const interval in activitati) {
          const item = activitati[interval];

          data.push({
            Nivel: nivel,
            An: an,
            Zi: zi,
            Interval: interval,
            Disciplina: item?.activitate || "", // dacă este string simplu
            Tip: item?.tip || "",                // dacă ai separat tipul
            Profesor: item?.profesor || "",
            Sala: item?.sala || ""
          });
        }
      }

      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, `${nivel}-${an}`);
    }
  }

  XLSX.writeFile(wb, "orar.xlsx");
};

const exportPDF = () => {
  if (!orar) return;
  const element = document.getElementById("orar-afisat");

  const optiuni = {
    margin: [0.3, 0.3, 0.3, 0.3],
    filename: "orar.pdf",
    image: { type: "jpeg", quality: 1 },
    html2canvas: {
      scale: 2.5,
      useCORS: true,
      scrollY: 0
    },
    jsPDF: {
      unit: "mm",
      format: "a3", // A3 pentru lățime mai mare
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


const grupeFiltrate = grupe.filter((g) => g.an === anSelectat);




const denumiriGrupeAnCurent = grupe
  .filter(g => g.an === anSelectat)
  .map(g => g.denumire);

const grupeAnCurent = grupe
  .filter((g) => g.an === anSelectat && g.nivel === nivelSelectat)
  .map((g) => g.denumire);


const renderOrar = () => {
  if (!orar) return null;

  const zileOrdine = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];

  const getBadgeClass = (tipActivitate) => {
    if (!tipActivitate) return "bg-secondary";
    if (tipActivitate.toLowerCase().includes("curs")) return "bg-info";
    if (tipActivitate.toLowerCase().includes("laborator")) return "bg-success";
    if (tipActivitate.toLowerCase().includes("seminar")) return "bg-warning";
    return "bg-secondary";
  };

  return (
    <div className="table-responsive" id="orar-afisat">
      {Object.entries(orar)
      .filter(([nivel]) => nivel === nivelSelectat)
      .map(([nivel, grupeOrar]) => (
        <div key={nivel}>
          <h2 className="text-primary fw-bold">{nivel}</h2>
          {Object.entries(grupeOrar).map(([denumireGrupa, zile]) => {
            const intervale = new Set();
            zileOrdine.forEach((zi) => {
              const ziData = zile[zi];
              if (ziData) {
                Object.keys(ziData).forEach((interval) => intervale.add(interval));
              }
            });

            const intervaleSortate = Array.from(intervale).sort();

            return (
              <div key={`${nivel}-${denumireGrupa}`} className="mb-4 page-break">
                <h4>📘 {nivel} – {denumireGrupa}</h4>
                <table className="table table-bordered text-center align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Interval</th>
                      {zileOrdine.map((zi) => (
                        <th key={zi}>{zi}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {intervaleSortate.map((interval) => (
                      <tr key={interval}>
                        <td><strong>{interval}</strong></td>
                        {zileOrdine.map((zi) => {
                          const activitate = zile[zi]?.[interval];
                          return (
                            <td key={`${zi}-${interval}`}>
                              {activitate ? (
                                typeof activitate === "object" ? (
                                  <>
                                    <span className={`badge ${getBadgeClass(activitate.tip)} mb-1`}>
                                      {activitate.activitate}
                                    </span>
                                    <div>{activitate.profesor}</div>
                                    <div className="text-muted">{activitate.sala}</div>
                                  </>
                                ) : (
                                  <span className="badge bg-secondary">{activitate}</span>
                                )
                              ) : (
                                "-"
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
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
  const toateGrupele = grupeAnCurent.map(g => g.denumire);

  const activitatiDeSincronizat = {
    curs: {},
    seminar: {},
    proiect: {},
  };

  // 🧠 Colectăm cursuri, seminarii și proiecte
  grupeAnCurent.forEach((g) => {
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
            zi,
            interval,
            sala: activ.sala
          });
        }
      });
    });
  });

  // ✅ Verificare sincronizare curs/seminar/proiect
  Object.entries(activitatiDeSincronizat).forEach(([tipActivitate, activitati]) => {
    Object.entries(activitati).forEach(([cheie, aparitii]) => {
      const ref = aparitii[0];
      const grupeGasite = new Set(aparitii.map(a => a.grupa));
      const grupeLipsa = toateGrupele.filter(gr => !grupeGasite.has(gr));

      const nesincronizate = aparitii.filter(
        (a) => a.zi !== ref.zi || a.interval !== ref.interval || a.sala !== ref.sala
      );

      const [nume, prof] = cheie.split("|").map(s => s[0].toUpperCase() + s.slice(1));

      if (grupeLipsa.length > 0) {
        cursuriProblema.push(`❌ ${tipActivitate.charAt(0).toUpperCase() + tipActivitate.slice(1)} ${nume} – ${prof} lipsește din grupele: ${grupeLipsa.join(", ")}`);
      }
      if (nesincronizate.length > 0) {
        cursuriProblema.push(`❌ ${tipActivitate.charAt(0).toUpperCase() + tipActivitate.slice(1)} ${nume} – ${prof} NU este sincronizat între grupele: ${nesincronizate.map(n => n.grupa).join(", ")}`);
      }
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
    const subgrupeLaborator = grupeAnCurent.filter(g => g.subgrupa); // doar subgrupe

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

  const combinatiiUnice = new Set(
    aparitii.map((a) => `${a.zi}-${a.interval}`)
  );

  if (combinatiiUnice.size === aparitii.length) {
    laboratoareValide += aparitii.length;
  } else {
    const grupeConflict = aparitii.map(a => a.grupa).join(", ");
    const [disciplina, prof] = cheie.split("|");
    eroriLaboratoare.push(`❌ Laboratorul ${disciplina} – ${prof} este programat simultan pentru: ${grupeConflict}`);
  }
});


  const totalActivitatiFinal = totalActivitati + laboratoareTotale;
const activitatiCorecteFinal = activitatiCorecte + laboratoareValide;
const procent = Math.round((activitatiCorecteFinal / (totalActivitatiFinal || 1)) * 100);


const mesaj = `
📊 Acuratețe estimată: ${procent || 0}% (${activitatiCorecteFinal} / ${totalActivitatiFinal} activități valide)
${cursuriProblema.length === 0 ? "✅ Cursuri, seminare și proiecte sunt sincronizate" : cursuriProblema.join("\n")}
${eroriLaboratoare.length === 0 ? "✅ Laboratoarele sunt distribuite corect între subgrupe" : eroriLaboratoare.join("\n")}
${lipsuri.length === 0 ? "✅ Toate grupele au cele 4 tipuri de activități" : lipsuri.join("\n")}
`.trim();


  setRaportValidare(mesaj);
};



  return (
   <div className="container-fluid pt-4 px-4">
{/* NAVBAR */}
      <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 mb-4">
        <div className="container-fluid position-relative d-flex justify-content-center align-items-center">
    
    {/* Stânga: Logo */}
    <span className="position-absolute start-0 navbar-brand fw-bold text-primary fs-4">
      Generator Orare
    </span>

    {/* Centru: Titlu */}
   <span className="text-primary fw-bold fs-4">
      📅 Orar Generat
    </span>

    {/* Dreapta: Butoane */}
    <div className="position-absolute end-0 d-flex">
      <button className="btn btn-outline-primary me-2" onClick={exportExcel}>
        ⬇ Export Excel
      </button>
      <button className="btn btn-outline-primary me-2" onClick={exportPDF}>
        🖨️ Export PDF
      </button>
    </div>
  </div>
</nav>



<div className="container mb-4">
  <div className="card shadow-sm border-0 bg-light">
    <div className="card-body">
      <p className="mb-2">
        <strong>🔍 Informații:</strong> Această pagină afișează orarul generat pentru studenți, incluzând profesori și săli disponibile.
      </p>
      <p className="mb-0">
        <strong>ℹ️ Notă:</strong> Asigură-te că ai introdus toate regulile și informațiile necesare pentru generarea orarului.
      </p>
    </div>
  </div>
</div>


<div className="d-flex align-items-center mb-4 gap-3">
<label className="me-2 fw-semibold text-primary">🎯 Selectează anul:</label>
<select
  className="form-select w-auto me-3"
  value={anSelectat}
  onChange={(e) => setAnSelectat(e.target.value)}
>
  <option value="" disabled>-- Selectează anul --</option>
  {aniDisponibili.map((an, idx) => (
    <option key={idx} value={an}>
      {an}
    </option>
  ))}
</select>

<label className="me-2 fw-semibold text-primary">🏫 Selectează nivelul:</label>
<select
  className="form-select w-auto me-3"
  value={nivelSelectat}
  onChange={(e) => setNivelSelectat(e.target.value)}
>
  <option value="Licenta">Licență</option>
  <option value="Master">Master</option>
</select>






        <button
          className="btn btn-success"
          onClick={genereazaOrar}
          disabled={loading}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Se generează...
            </>
          ) : (
            "🚀 Generează orar"
          )}
        </button>
      </div>

{esteOrarSalvat && (
  <div className="alert alert-warning d-flex align-items-center gap-2">
    <i className="bi bi-info-circle-fill fs-5"></i>
    <span>
      Orarul afișat provine dintr-o <strong>salvare anterioară</strong>.
    </span>
    <button
      className="btn btn-sm btn-outline-secondary ms-auto"
      onClick={() => {
        setOrar(null);
        setEsteOrarSalvat(false);
      }}
    >
      ❌ Golește orarul
    </button>
  </div>
)}



{renderOrar()}

{raportValidare && (
  <div className="alert alert-info mt-4" style={{ whiteSpace: "pre-wrap" }}>
    <strong>📋 Raport de validare orar:</strong>
    <br />
    {raportValidare}
  </div>
)}


<div className="card shadow-sm border-0 mt-5">
  <div className="card-header bg-light fw-bold text-primary">
    📂 Orare salvate anterior
  </div>
  <div className="card-body p-0">
    {orareSalvate.length === 0 ? (
      <p className="text-muted p-3 mb-0">Nu există orare salvate în sistem.</p>
    ) : (
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        <ul className="list-group list-group-flush">
          {orareSalvate.map((orar) => (
            <li
              key={orar.id}
              className="list-group-item d-flex justify-content-between align-items-start flex-wrap"
            >
              <div className="me-auto">
                <div className="fw-semibold text-dark">
  📘 {orar.nume ? orar.nume : `${orar.nivel} – ${orar.an}`}
</div>

                <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                  {new Date(orar.data_creare).toLocaleString("ro-RO", {
                    timeZone: "UTC",
                    hour12: false,
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
              </div>
                    <button
        className="btn btn-sm btn-outline-success"
        onClick={() => editeazaDenumire(orar.id, orar.nume)}
      >
        ✏️ Editează
      </button>

              <div className="d-flex gap-2 mt-2 mt-sm-0">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => incarcaOrarSalvat(orar.id)}
                >
                  🔄 Încarcă
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => stergeOrar(orar.id)}
                >
                  🗑️ Șterge
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
</div>



{/*}
{regula_id && continutRegula && (
  <div
    className="card shadow-sm border-0"
    style={{
      fontSize: "0.85rem",
      marginTop: "0.5rem",
      maxWidth: "500px", // opțional, pentru a-l face mai îngust
    }}
  >

      {regula_id && denumireRegulaSelectata && (
  <div className="alert alert-info d-flex justify-content-between align-items-center mt-3">
    <div>
      <i className="bi bi-check-circle-fill me-2 text-primary"></i>
      <strong>Regulă selectată:</strong> <em>{denumireRegulaSelectata}</em>
    </div>
    <span className="badge bg-primary text-white">ID: {regula_id}</span>
  </div>
)}


    <div
      className="card-header bg-light fw-bold text-primary py-1 px-2"
      style={{ fontSize: "0.9rem" }}
    >
      📜 Conținutul regulii selectate
    </div>
    <div
      className="card-body py-2 px-2"
      style={{
        whiteSpace: "pre-wrap",
        fontFamily: "monospace",
        backgroundColor: "#f8f9fa",
        fontSize: "0.8rem",
        lineHeight: "1.3",
      }}
    >
      {continutRegula}
    </div>
  </div>
)}
*/}


  
      {/* FOOTER */}
      <footer className="bg-white text-center text-muted py-3 border-top mt-auto">
        <p className="mb-0">© {new Date().getFullYear()} Generator Orare</p>
      </footer>
    </div>
  );
  
};

export default GeneratedTimetable;