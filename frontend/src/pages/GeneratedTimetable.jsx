import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";
import { useLocation } from "react-router-dom";

const GeneratedTimetable = () => {
  const [orar, setOrar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profesori, setProfesori] = useState([]);
  const [sali, setSali] = useState([]);
  const [grupe, setGrupe] = useState([]);
  const location = useLocation();
  const { regula_id, denumire: denumireRegulaSelectata, continut: continutRegula } = location.state || {};
const [nivelSelectat, setNivelSelectat] = useState("Licenta");

  const [anSelectat, setAnSelectat] = useState("");
const [grupaSelectata, setGrupaSelectata] = useState("");



const toateGrupele = nivelSelectat && orar?.[nivelSelectat]
  ? Object.keys(orar[nivelSelectat])
  : [];


useEffect(() => {
  const incarcaDate = async () => {
    try {
      const response = await fetch("http://localhost:5000/date_orar");
      const data = await response.json();

      console.log("GRUPE RECEPȚIONATE:", data.grupe);

      setProfesori(data.profesori || []);
      setSali(data.sali || []);
      setGrupe(data.grupe || []);
      setReguli(data.reguli?.continut || ""); // dacă e obiect

      // Setează automat anul dacă nu e selectat
      if ((data.grupe || []).length > 0 && !anSelectat) {
        const ani = Array.from(new Set(data.grupe.map(g => g.an))).sort();
        setAnSelectat(ani[0]);
      }
    } catch (err) {
      console.error("Eroare la încărcarea datelor:", err);
    }
  };

  incarcaDate();
}, []);



const [reguli, setReguli] = useState(` 📜 REGULI STRICTE PENTRU GENERAREA ORARULUI:
  Se va completa stric pentru ANUL și NIVELUL selectat (Licență sau Master) și pentru TOATE grupele/subgrupele disponibile.
1. Orarul trebuie să acopere întreaga săptămână (Luni–Vineri) pentru TOATE grupele disponibile, structurate astfel:
   - Cursurile se desfășoară pe AN.
   - Seminarele și proiectele pe GRUPĂ.
   - Laboratoarele pe SUBGRUPĂ.

2. Intervalele orare disponibile sunt:
   - "08:00–10:00", "10:00–12:00", "12:00–14:00", "14:00–16:00", "16:00–18:00", "18:00–20:00".

3. Programul zilnic:
   - **Licență**: între 08:00 și 20:00.
   - **Master**: între 16:00 și 20:00.
   - Fiecare zi trebuie să conțină între **4 și 8 ore** de activități (adică 2–4 activități de câte 2 ore).
   - NU este permisă mai mult de **o pauză (fereastră de 2 ore)** pe zi.
   - Este RECOMANDAT ca programul să nu aibă ferestre. Dacă nu se poate evita (lipsă sală/profesor), pauza trebuie să fie inclusă în limita maximă de 8 ore.

4. Tipuri de activități:
   - Cursurile se susțin doar în săli cu prefix **GC** (ex: GC1, GC2).
   - Seminarele și laboratoarele se desfășoară doar în săli cu prefix **GA** (ex: GA1, GA2).
   - **Sălile NU pot fi folosite simultan de licență și master** în același interval orar.
   - **O sală NU poate fi folosită de mai multe activități în același interval orar**.

5. **Ziua de miercuri, intervalul 14:00–16:00 va fi liber** pentru toate grupele (niciun curs, seminar sau laborator).

6. La activități se vor afișa detalii astfel:
   - **Cursuri**: denumirea completă + prescurtarea disciplinei + numele profesorului + sala.
     Ex: „Programare (PR) – Ion Popescu – GC1”
   - **Seminare/Laboratoare**: doar acronimul + numele profesorului + sala.
     Ex: „PR – Ion Popescu – GA1”

7. NU inventa discipline, profesori sau săli. Folosește DOAR datele primite.

8. Structura JSON a orarului trebuie să fie VALIDĂ și COMPLETĂ.

Pentru fiecare nivel (Licență și Master), trebuie să generezi orarul pentru TOATE grupele și subgrupele existente. Listele exacte de grupe sunt furnizate mai sus (ex: I1a, I1b, I2a, I2b, M1a etc.). Nu omite niciuna.

Pentru fiecare grupă sau subgrupă:
- Generează orarul complet de luni până vineri.
- Pentru fiecare zi, include toate intervalele orare permise (ex: 08:00–10:00, 10:00–12:00 etc.).
- Completează fiecare interval cu o activitate validă în formatul:
🧠 IMPORTANT: Grupele pentru care trebuie să generezi orar sunt cele listate mai sus. Completează orarul pentru TOATE, fără a omite nicio grupă. Dacă există 24 de grupe la Licență și 4 la Master, orarul trebuie generat pentru toate 28.


  Dacă nu sunt suficiente activități, profesori sau săli, reutilizează-le inteligent astfel încât fiecare grupă să aibă activități în fiecare zi (respectând regulile).

NU folosi un singur string lung. NU combina detaliile într-un câmp. Fiecare activitate TREBUIE să aibă cele 4 câmpuri distincte: activitate, tip, profesor, sala.

‼️ NU omite nicio zi. Fiecare grupă/subgrupă trebuie să aibă activități în fiecare zi (cu excepția intervalului 14:00–16:00 miercuri). NU trimite JSON incomplet sau cu erori de sintaxă.

{"role": "system", "content": "Răspunde DOAR cu JSON VALID. FĂRĂ comentarii, fără explicații, fără // sau ... . Începe cu { și termină cu }."},

`);


  const genereazaOrar = async () => {
    setLoading(true);

    const instructiuniProfesori = profesori.map(
  (p) => `- ${p.nume} (${p.disciplina})`
).join("\n");

    const instructiuniSali = sali.map((s) => `- ${s.cod} (${s.tip})`).join("\n");

    const instructiuniGrupe = grupe.map( 
  (g) =>
    `- ${g.denumire} (${g.nivel}, anul ${g.an}, grupa ${g.grupa}, subgrupa ${g.subgrupa})`
).join("\n");

const instructiuniGPT = `NU include chei precum "luni", "marti", etc. la nivel global. Toate activitățile trebuie să fie plasate exclusiv în interiorul structurii de grupe/subgrupe, sub Licenta și Master.
🔒 RESTRICȚII SUPLIMENTARE:
1. Un profesor poate ține **cursul** în același timp pentru toate grupele acelui an (ex: LI1a, LI1b etc.).  
   Însă NU poate ține mai multe **seminare, laboratoare sau proiecte** în același interval orar, chiar dacă sunt la grupe sau subgrupe diferite.

2. Toate zilele (Luni–Vineri) trebuie să fie prezente pentru fiecare grupă, chiar dacă nu sunt activități în toate intervalele.

3. Miercuri, intervalul 14:00–16:00 este obligatoriu **liber** pentru toate grupele, dar în restul intervalelor trebuie să existe activități, dacă e posibil.


Fiecare interval orar trebuie să conțină exact 4 câmpuri:
- "activitate": denumirea completă și prescurtată (ex. Algoritmi (AL))
- "tip": Curs / Seminar / Laborator
- "profesor": Nume și prenume
- "sala": cod sală (ex. GC1)

Fiecare grupă/subgrupă trebuie să aibă toate zilele (Luni–Vineri) prezente. Chiar dacă unele zile nu conțin activități, acestea trebuie incluse cu {}.

NU folosi array-uri pentru activități. Fiecare interval este un obiect.
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
      },
      ...
    }
  },
  
}



`; 


const promptFinal = `
✅ LISTA COMPLETĂ de profesori și discipline (nu inventa altele):
${instructiuniProfesori}

🏫 Săli disponibile:
${instructiuniSali}

👥 Grupe disponibile:
${instructiuniGrupe}

${reguli}

${instructiuniGPT}
`;

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
}),

  });

  const data = await response.json();

  try {
    // Validare JSON (opțională)
    JSON.stringify(data);
    setOrar(data);
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


const instructiuniGrupe = grupeFiltrate.map(
  (g) =>
    `- ${g.denumire} (${g.nivel}, anul ${g.an}, grupa ${g.grupa}, subgrupa ${g.subgrupa})`
).join("\n");

const denumiriGrupeAnCurent = grupe
  .filter(g => g.an === anSelectat)
  .map(g => g.denumire);

const grupeAnCurent = grupe
  .filter((g) => g.an === anSelectat && g.nivel === nivelSelectat)
  .map((g) => g.denumire);


const renderOrar = () => {
  if (!orar || !anSelectat || !nivelSelectat) return null;

  // Grupele pentru anul și nivelul selectat
  const grupeAnCurent = grupe
    .filter((g) => g.an === anSelectat && g.nivel === nivelSelectat)
    .map((g) => g.denumire);

  console.log("Nivel selectat:", nivelSelectat);
  console.log("Grupe în orar:", Object.keys(orar[nivelSelectat] || {}));
  console.log("Grupe an curent:", grupeAnCurent);

  const zileOrdine = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];

  const extrageIntervale = (orarNivel) => {
    const intervaleSet = new Set();
    for (const zi of zileOrdine) {
      for (const grupa in orarNivel) {
        if (!grupeAnCurent.includes(grupa)) continue;
        const ziGrupa = orarNivel[grupa][zi];
        if (ziGrupa) {
          Object.keys(ziGrupa).forEach((interval) =>
            intervaleSet.add(interval)
          );
        }
      }
    }
    return Array.from(intervaleSet).sort();
  };

  const getBadgeClass = (tipActivitate) => {
    if (tipActivitate.toLowerCase().includes("curs")) return "bg-info";
    if (tipActivitate.toLowerCase().includes("laborator")) return "bg-success";
    if (tipActivitate.toLowerCase().includes("seminar")) return "bg-warning";
    return "bg-secondary";
  };

  return (
    <div className="table-responsive" id="orar-afisat">
      {Object.entries(orar).map(([nivel, grupeOrar]) => {
        if (nivel !== nivelSelectat) return null;

        const grupeFiltrate = Object.entries(grupeOrar).filter(
          ([denumireGrupa]) => grupeAnCurent.includes(denumireGrupa)
        );

        if (grupeFiltrate.length === 0) return null;

        const intervale = extrageIntervale(grupeOrar);

        return (
          <div key={nivel}>
            <h2 className="text-primary fw-bold">{nivel}</h2>
            {grupeFiltrate.map(([denumireGrupa, zile]) => (
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
                    {intervale.map((interval) => (
                      <tr key={interval}>
                        <td><strong>{interval}</strong></td>
                        {zileOrdine.map((zi) => {
                          const activitate = zile?.[zi]?.[interval];
                          return (
                            <td key={`${zi}-${interval}`}>
                              {activitate ? (
                                <div>
                                  {typeof activitate === "object" ? (
                                    <>
                                      <span
                                        className={`badge ${getBadgeClass(
                                          activitate.tip
                                        )} mb-1`}
                                      >
                                        {activitate.activitate}
                                      </span>
                                      <div>{activitate.profesor}</div>
                                      <div className="text-muted">
                                        {activitate.sala}
                                      </div>
                                    </>
                                  ) : (
                                    <span className="badge bg-secondary">
                                      {activitate}
                                    </span>
                                  )}
                                </div>
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
            ))}
          </div>
        );
      })}
    </div>
  );
};





const aniDisponibili = Array.from(
  new Set(grupe.filter(g => g.nivel === nivelSelectat).map((g) => g.an))
).sort();

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




{renderOrar()}


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



  
      {/* FOOTER */}
      <footer className="bg-white text-center text-muted py-3 border-top mt-auto">
        <p className="mb-0">© {new Date().getFullYear()} Generator Orare</p>
      </footer>
    </div>
  );
  
};

export default GeneratedTimetable;