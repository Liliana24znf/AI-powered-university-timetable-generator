import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";

const GeneratedTimetable = () => {
  const [orar, setOrar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profesori, setProfesori] = useState([]);
  const [sali, setSali] = useState([]);

  useEffect(() => {
    const incarcaDate = async () => {
      try {
        const response = await fetch("http://localhost:5000/date_orar");
        const data = await response.json();
        setProfesori(data.profesori || []);
        setSali(data.sali || []);
      } catch (err) {
        console.error("Eroare la încărcarea datelor:", err);
      }
    };
    incarcaDate();
  }, []);

  const [reguli, setReguli] = useState(`
📜 Reguli stricte pentru generarea orarului:

1. Orarul trebuie să acopere întreaga săptămână (Luni, Marți, Miercuri, Joi, Vineri), pentru TOATE următoarele grupe:
   - Licență: Anul I și  Anul II și  Anul III și Anul IV
   - Master: Anul I și Anul II

2. Pentru FIECARE zi (Luni, Marți, Miercuri, Joi, Vineri) și FIECARE an, trebuie să existe între 4 și 8 ore de activități (adică 2–4 activități de câte 2 ore). NU lăsa nicio zi necompletată pentru niciun an. NU folosi {} pentru o zi întreagă.

3. Toate cele 6 intervale orare posibile sunt:
   - 08:00–10:00, 10:00–12:00, 12:00–14:00, 14:00–16:00, 16:00–18:00, 18:00–20:00.
 Programul zilnic:
   - Licență Anul I și  Anul II și  Anul III și Anul IV: între 08:00–20:00.
   - Master Anul I și Anul II: între 16:00–20:00.

4. Activitățile sunt de tip: Curs, Seminar, Laborator.
   - Cursuri: doar în săli de tip GC*
   - Seminare/Laboratoare: doar în săli de tip GA*
   - Un profesor predă doar disciplinele și tipurile menționate.
   - O sală nu poate fi reutilizată în același interval orar din aceeași zi, dar poate fi utilizată in zile diferite.
   - Sălile nu pot fi partajate între licență și master în același interval.

5. NU inventa date noi. Nu adăuga alte discipline, profesori sau săli. Folosește doar combinațiile posibile.

6.  Toți ani trebuiesc completați în fiecare zi.

7. Răspunsul trebuie să fie JSON VALID și COMPLET. Structura este:

{
  "Licenta": {
    "Anul I": {
      "Luni": {
        "08:00-10:00": {
          "activitate": "Curs Programare",
          "profesor": "Ion Popescu",
          "sala": "GC1"
        }
      },
      ...
    },
    ...
  },
  "Master": {
    "Anul I": {
      ...
    },
    "Anul II": {
      ...
    }
  }
}


‼️ Nu returna JSON incomplet. Nu omite nicio zi, niciun an. Fiecare an trebuie să aibă activități în fiecare zi!

  `);

  const genereazaOrar = async () => {
    setLoading(true);

    const instructiuniProfesori = profesori.map((p) =>
      p.discipline
        .map(
          (disc) =>
            `- ${p.nume} predă disciplina "${disc}" (${p.tipuri.join("/")}) pentru nivelul ${p.niveluri.join("/")}.`
        )
        .join("\n")
    ).join("\n");

    const instructiuniSali = sali.map((s) => `- ${s.cod} (${s.tip})`).join("\n");

    const promptFinal = `
✅ LISTA COMPLETĂ de profesori și discipline (nu inventa altele):
${instructiuniProfesori}

🏫 Săli disponibile:
${instructiuniSali}

${reguli}
`;

    try {
      const response = await fetch("http://127.0.0.1:5000/genereaza_orar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reguli: promptFinal }),
      });

      const data = await response.json();
      setOrar(data);
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

  html2pdf()
    .set({
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: "orar.pdf",
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "landscape"
      },
      pagebreak: {
        mode: ['css', 'legacy']
      }
    })
    .from(element)
    .save();
};



  const renderOrar = () => {
    const extrageIntervale = (orarNivel) => {
      const intervaleSet = new Set();
      for (const zi of zileOrdine) {
        for (const an in orarNivel) {
          const ziAn = orarNivel[an][zi];
          if (ziAn) {
            Object.keys(ziAn).forEach(interval => intervaleSet.add(interval));
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
      <div className="table-responsive">
        {Object.entries(orar).map(([nivel, ani]) => {
          const intervale = extrageIntervale(ani);
  
          return (
            <div key={nivel}>
              <h2>{nivel}</h2>
              {Object.entries(ani).map(([an, zile]) => (
                  <div key={`${nivel}-${an}`} className="mb-4 page-break">
                  <h4>📘 {nivel} – {an}</h4>
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
                                    <span className={`badge ${getBadgeClass(activitate.activitate)} mb-1`}>
                                      {activitate.activitate}
                                    </span>
                                    <div>{activitate.profesor}</div>
                                    <div className="text-muted">{activitate.sala}</div>
                                  </div>
                                ) : ""}
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
  
      {/* CONȚINUT */}
      <div className="container py-4">
        <h2 className="mb-3">📅 Generare Orar cu GPT-4</h2>
  
        <div className="mb-3">
          <label className="form-label fw-semibold">📝 Editare reguli:</label>
          <textarea
            className="form-control"
            value={reguli}
            onChange={(e) => setReguli(e.target.value)}
            rows={10}
          />
        </div>
  
        <div className="d-flex flex-wrap gap-2 mb-4">
          <button className="btn btn-success" onClick={genereazaOrar}>
            ⚙️ Generează Orar
          </button>
          <button className="btn btn-outline-secondary" onClick={() => setOrar(null)}>
            🔄 Resetează Orar
          </button>
          <button className="btn btn-outline-danger" onClick={() => setReguli("")}>
            🗑️ Resetează Reguli
          </button>
        </div>
  
        {loading && <p>⏳ Se generează orarul...</p>}
  
        {orar && (
          <>
            <div id="orar-afisat">
              <h4 className="mt-4">📋 Orar Generat:</h4>
              {renderOrar()}
  
              <div className="mt-5">
                <h5>👨‍🏫 Profesori incluși:</h5>
                <ul className="list-group mb-4">
                  {profesori.map((p, idx) => (
                    <li key={idx} className="list-group-item">
                      <strong>{p.nume}</strong> – {p.nivel} – {p.tipuri.join("/")} – {p.discipline.join(", ")}
                    </li>
                  ))}
                </ul>
  
                <h5>🏫 Săli disponibile:</h5>
{!sali.length ? (
  <p className="text-muted">⚠️ Nu există săli disponibile în acest moment.</p>
) : (
  <ul className="list-group">
    {sali.map((s, i) => (
      <li key={i} className="list-group-item">
        {s.cod} – {s.tip}
      </li>
    ))}
  </ul>
)}

              </div>
            </div>
          </>
        )}
  
        {!orar && !loading && (
          <p className="text-muted">📭 Nu a fost generat niciun orar încă. Apasă „Generează Orar”.</p>
        )}
      </div>
  
      {/* FOOTER */}
      <footer className="bg-white text-center text-muted py-3 border-top mt-auto">
        <p className="mb-0">© {new Date().getFullYear()} Generator Orare</p>
      </footer>
    </div>
  );
  
};

export default GeneratedTimetable;