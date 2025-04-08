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

    return (
      <div>
        {Object.entries(orar).map(([nivel, ani]) => {
          const intervale = extrageIntervale(ani);

          return (
            <div key={nivel}>
              <h2>{nivel}</h2>
              {Object.entries(ani).map(([an, zile]) => (
                <div key={`${nivel}-${an}`} style={{ marginBottom: "40px" }}>
                  <h4>📘 {nivel} – {an}</h4>
                  <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%", textAlign: "center" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f0f0f0" }}>
                        <th style={{ width: "150px" }}>Interval</th>
                        {zileOrdine.map((zi) => (
                          <th key={zi}>{zi}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {intervale.map((interval) => (
                        <tr key={interval}>
                          <td><strong>{interval}</strong></td>
                          {zileOrdine.map((zi) => (
                            <td key={`${zi}-${interval}`}>
                            {(() => {
                              const activitateObj = zile?.[zi]?.[interval];
                              if (!activitateObj) return "";
                              return (
                                <>
                                  <div><strong>{activitateObj.activitate}</strong></div>
                                  <div>{activitateObj.profesor}</div>
                                  <div>{activitateObj.sala}</div>
                                </>
                              );
                            })()}
                          </td>
                          
                          ))}
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
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Generare Orar cu GPT-4</h2>

      <h4>📝 Editare reguli:</h4>
      <textarea
        value={reguli}
        onChange={(e) => setReguli(e.target.value)}
        rows={10}
        cols={80}
        style={{ fontSize: "14px", width: "100%", maxWidth: "800px" }}
      />
      <br />
      <button onClick={genereazaOrar} style={{ marginTop: "10px" }}>
        Generează Orar
      </button>
      <button onClick={() => setOrar(null)} style={{ marginLeft: "10px" }}>
        Resetează Orar
      </button>
      <button onClick={() => setReguli("")} style={{ marginLeft: "10px" }}>
        Resetează Reguli
      </button>

      {loading && <p>⏳ Se generează orarul...</p>}

      {orar && (
        <>
          <div style={{ marginTop: "20px" }}>
            <button onClick={exportExcel}>Exportă în Excel</button>
            <button onClick={exportPDF} style={{ marginLeft: "10px" }}>
              Exportă în PDF
            </button>
          </div>

          <div id="orar-afisat" style={{ marginTop: "20px" }}>
            <h3>📅 Orar Generat</h3>
            {renderOrar()}

            <div style={{ marginTop: "40px" }}>
              <h4>📋 Profesori incluși:</h4>
              <ul>
                {profesori.map((p, idx) => (
                  <li key={idx}>
                    <strong>{p.nume}</strong> – {p.nivel} – {p.tipuri.join("/")} – {p.discipline.join(", ")}
                  </li>
                ))}
              </ul>

              <h4>🏫 Săli disponibile:</h4>
              <ul>
                {sali.map((s, i) => (
                  <li key={i}>{s.cod} – {s.tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {!orar && !loading && (
        <p>📭 Nu a fost generat niciun orar încă. Apasă „Generează Orar”.</p>
      )}
    </div>
  );
};

export default GeneratedTimetable;
