import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";

const GeneratedTimetable = () => {
  const [orar, setOrar] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const profesori = location.state?.profesori || [];
  const sali = location.state?.sali || [];

  const [reguli, setReguli] = useState(`
Generează un orar pentru o săptămână pentru studenți, structurat pe ani de studiu, respectând următoarele reguli:

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
   - Intervalele orare sunt: 08:00–10:00, 10:00–12:00, 12:00–14:00, ..., până la 20:00.

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


    `);

  const genereazaOrar = async () => {
    setLoading(true);

    const instructiuniProfesori = profesori.map((p) => {
      const disciplineList = p.discipline.filter(Boolean).join(", ");
      const tipuriList = p.tipuri.join("/");
      return `Profesorul ${p.nume} predă disciplinele: ${disciplineList}, pentru nivelul ${p.nivel}, tipuri: ${tipuriList}.`;
    }).join("\n");

    const instructiuniSali = sali.map((s) => `${s.cod} (${s.tip})`).join(", ");

    const promptFinal = `
Lista profesorilor:
${instructiuniProfesori}

Lista sălilor disponibile:
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
            data.push({
              Nivel: nivel,
              An: an,
              Zi: zi,
              Interval: interval,
              Activitate: activitati[interval],
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
        margin: 0.5,
        filename: "orar.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
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
                <div key={`${nivel}-${an}`} className="mb-4">
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
    <div style={{ minHeight: "100vh", width: "250%", display: "flex", flexDirection: "column" }}>
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm px-4">
        <div className="container-fluid justify-content-between">
          <span className="navbar-brand fw-bold text-white fs-4">
            Generator Orare
          </span>
          <div>
            <button className="btn btn-light me-2" onClick={exportExcel}>
              ⬇ Export Excel
            </button>
            <button className="btn btn-light" onClick={exportPDF}>
              🖨️ Export PDF
            </button>
          </div>
        </div>
      </nav>
  
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
