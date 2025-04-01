import React, { useState } from "react";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";

const GeneratedTimetable = () => {
  const [orar, setOrar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reguli, setReguli] = useState(`
Generează un orar pentru o săptămână pentru studenți, structurat pe ani de studiu, respectând următoarele reguli:
- Programul zilnic pentru studenții de la licență va fi între 08:00-20:00, iar pentru cei de la master între 16:00-20:00.
- Pentru fiecare zi, generează orar pentru TOATI cei 4 ANI de studiu de la licență (Anul I, II, III, IV) și TOATE anii de la master (ex: Anul I, II). Toți anii trebuie să fie incluși, chiar dacă unii nu au activități.
- Fiecare zi trebuie să aibă minim 4 ore și maxim 8 ore de activitate.
- Completeaza toate zilele săptămânii (Luni, Marți, Miercuri, Joi, Vineri), fără a lăsa zile goale.
- Nu include pauze între activități.
- Folosește denumiri reale de discipline pentru fiecare an de studiu, la care sa scrii daca este curs/laborator/seminar.
- Activitățile trebuie să fie distribuite uniform pe parcursul săptămânii.
- Nu repeta activitățile în aceeași săptămână.
- Activitățile pentru studenții de la licență vor fi diferite de cele pentru studenții de la master.
- Structura: cursuri la nivel de an, seminare la nivel de grupă, laboratoare la nivel de subgrupă.
- Ziua de miercuri la ora 14:00 trebuie să fie liberă.
- Răspunde doar cu un JSON curat, fără explicații, cu structura: { "Licenta": { "Anul I": { "Luni": { interval: activitate }, ... } }, "Master": {...} }
  `);

  const genereazaOrar = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/genereaza_orar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reguli }),
      });

      const data = await response.json();
      console.log("Răspuns backend:", data);
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
    const zileOrdine = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];
  
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
                              {zile?.[zi]?.[interval] || ""}
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
