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
Generează un orar pentru o săptămână pentru studenți, structurat pe ani de studiu, respectând următoarele reguli:
⚠️ IMPORTANT:
- Nu ai voie să folosești alte discipline sau profesori decât cei enumerați mai sus.
- Fiecare activitate trebuie să corespundă exact cu un profesor, o disciplină, un tip și o sală din cele oferite.
- Dacă nu există combinație validă, lasă acel interval orar necompletat ({}).

1. Programul zilnic:
   - Licență: între 08:00–20:00.
   - Master: între 16:00–20:00.

2. Pentru fiecare zi, generează orar pentru toți cei 4 ani de licență (Anul I, II, III, IV) și toți anii de la master (Anul I, II). Toți anii trebuie să fie incluși, chiar dacă unii nu au activități.

3. Activitățile:
   - Min. 4 ore și max. 8 ore / zi / an.
   - Distribuite uniform pe parcursul săptămânii.
   - Fără pauze între activități.
   - Fără repetiții ale aceleiași activități în săptămână.
   - Durata fiecărei activități este de 2 ore.
   - Intervalele orare sunt: 08:00–10:00, 10:00–12:00, 12:00–14:00, 14:00-16:00, 16:00-18:00, 18:00-20:00.

4. Structura:
   - Cursuri: nivel de an
   - Seminare: nivel de grupă
   - Laboratoare: nivel de subgrupă

5. Miercuri ora 14:00 trebuie să fie liberă.

6. Folosește DOAR disciplinele și profesorii transmiși. Nu genera alții.
   - La fiecare activitate: scrie disciplina, tipul (Curs/Seminar/Laborator), profesorul, sala.

7. Săli:
   - GC* → doar cursuri
   - GA* → doar seminare/laboratoare
   - Fiecare sală poate fi folosită o singură dată într-un interval orar.
   - Nu folosi aceeași sală în același interval orar la nivele diferite (ex: Licență și Master).
   - Nu inventa săli.

8. Profesori:
   - Nu muta profesori între niveluri. Dacă e pentru Licență, nu apare la Master și invers.
   - O disciplină e predată doar de profesorul specificat.

9. JSON:
   - Răspunsul trebuie să fie doar JSON valid.
   - Structura trebuie să conțină TOATE zilele (Luni–Vineri) pentru fiecare an, chiar dacă unele sunt goale.
   - TOATE intervalele orare definite trebuie verificate și completate dacă există activități.
   - Începe cu { și termină cu }.

Structura JSON:
{
  "Licenta": {
    "Anul I": {
      "Luni": {
        "08:00-10:00": {
          "activitate": "Curs Matematică",
          "profesor": "Popescu Ion",
          "sala": "GC1"
        }
      },
      "Marti": {},
      "Miercuri": {},
      "Joi": {},
      "Vineri": {}
    }
  },
  "Master": { ... }
}


10. Obligatoriu:
   - Pentru fiecare AN (ex: Licență Anul I, II, III, IV și Master Anul I, II) trebuie să existe o intrare în fiecare zi a săptămânii (Luni–Vineri).
   - Dacă într-o zi nu există activitate pentru acel an, ziua va fi prezentă cu valoare {}.
   - Nu lăsa zile lipsă din structura JSON.

   NU OMITE NICIO ZI din săptămână (Luni–Vineri) și NICIUN AN. Toți trebuie să fie prezenți cu cel puțin o structură JSON. NU returna niciodată JSON incomplet!

   11. Completează activități pentru TOȚI anii, nu doar Anul I. Fiecare an trebuie să aibă cel puțin 4 ore/zi activități. Nu lăsa anii fără activități.

   12. NU AI VOIE să adaugi alți profesori sau discipline. Folosește EXCLUSIV pe cei furnizați mai sus. Dacă rămâi fără opțiuni, lasă slotul gol.


  `);

  const genereazaOrar = async () => {
    setLoading(true);

    const instructiuniProfesori = profesori.map((p) => {
      return p.discipline
        .map((disc) => {
          return `- ${p.nume} predă disciplina "${disc}" (${p.tipuri.join("/")}) pentru nivelul ${p.niveluri.join("/")}.`;
        })
        .join("\n");
    }).join("\n");

    const instructiuniSali = sali.map((s) => `- ${s.cod} (${s.tip})`).join("\n");

    const promptFinal = `
✅ LISTA COMPLETĂ de profesori și discipline (nu inventa altele):
${instructiuniProfesori}

🏫 Săli disponibile:
${instructiuniSali}

📜 Reguli:
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