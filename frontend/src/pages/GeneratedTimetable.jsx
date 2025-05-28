import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";

const GeneratedTimetable = () => {
  const [orar, setOrar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profesori, setProfesori] = useState([]);
  const [sali, setSali] = useState([]);
  const [grupe, setGrupe] = useState([]);


  useEffect(() => {
    const incarcaDate = async () => {
      try {
        const response = await fetch("http://localhost:5000/date_orar");
        const data = await response.json();
        setProfesori(data.profesori || []);
        setSali(data.sali || []);
        setGrupe(data.grupe || []);
      } catch (err) {
        console.error("Eroare la încărcarea datelor:", err);
      }
    };
    incarcaDate();
  }, []);

const [reguli, setReguli] = useState(` 📜 REGULI STRICTE PENTRU GENERAREA ORARULUI:
Toti ani, toate grupele si toate subgrupele de la Licenta si Master sa fie completate.
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

Dacă nu există suficienți profesori, discipline sau săli, reutilizează-le în mod inteligent, astfel încât să respecți regulile și să umpli toate zilele și grupele.
{
  "Licenta": {
    "I1a": { ... },
    "I1b": { ... },
    ...
  },
  "Master": {
    "MI1": { ... },
    "MI2": { ... },
    ...
  }
}

La fiecare activitate, folosește formatul:

"interval": {
  "activitate": "Denumire completă",
  "tip": "Curs/Seminar/Laborator",
  "profesor": "Prenume Nume",
  "sala": "GC1/GA2 etc."
}
  Dacă nu sunt suficiente activități, profesori sau săli, reutilizează-le inteligent astfel încât fiecare grupă să aibă activități în fiecare zi (respectând regulile).

NU folosi un singur string lung. NU combina detaliile într-un câmp. Fiecare activitate TREBUIE să aibă cele 4 câmpuri distincte: activitate, tip, profesor, sala.

‼️ NU omite nicio zi. Fiecare grupă/subgrupă trebuie să aibă activități în fiecare zi (cu excepția intervalului 14:00–16:00 miercuri). NU trimite JSON incomplet sau cu erori de sintaxă.

{"role": "system", "content": "Răspunde DOAR cu JSON VALID. FĂRĂ comentarii, fără explicații, fără // sau ... . Începe cu { și termină cu }."},

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

    const instructiuniGrupe = grupe.map(
  (g) =>
    `- ${g.denumire} (${g.nivel}, anul ${g.an}, grupa ${g.grupa}, subgrupa ${g.subgrupa})`
).join("\n");


    const promptFinal = `
✅ LISTA COMPLETĂ de profesori și discipline (nu inventa altele):
${instructiuniProfesori}

🏫 Săli disponibile:
${instructiuniSali}

👥 Grupe disponibile:
${instructiuniGrupe}

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
    for (const grupa in orarNivel) {
      const ziGrupa = orarNivel[grupa][zi];
      if (ziGrupa) {
        Object.keys(ziGrupa).forEach(interval => intervaleSet.add(interval));
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
        {Object.entries(orar).map(([nivel, grupeOrar]) => {
          const intervale = extrageIntervale(grupeOrar);

          return (
            <div key={nivel}>
              <h2>{nivel}</h2>
              {Object.entries(grupeOrar).map(([denumireGrupa, zile]) => (

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
          <span className={`badge ${getBadgeClass(activitate.tip)} mb-1`}>
            {activitate.activitate}
          </span>
          <div>{activitate.profesor}</div>
          <div className="text-muted">{activitate.sala}</div>
        </>
      ) : (
        <span className="badge bg-secondary">{activitate}</span>
      )}
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
  
<h5 className="mt-4">🏫 Săli disponibile:</h5>

{["Curs", "Laborator", "Seminar"].map((tip) => {
  const saliTip = sali
    .filter((s) => s.tip === tip)
    .sort((a, b) => parseInt(a.cod.replace(/\D/g, "")) - parseInt(b.cod.replace(/\D/g, "")));

  const culoare =
    tip === "Curs" ? "text-primary" :
    tip === "Laborator" ? "text-success" :
    "text-warning";

  const icon =
    tip === "Curs" ? "📘" :
    tip === "Laborator" ? "🧪" :
    "📝";

  return (
    <div key={tip} className="mb-3">
      <h6 className={`fw-bold ${culoare}`}>{icon} Săli de {tip} ({saliTip.length})</h6>
      {saliTip.length === 0 ? (
        <p className="text-muted fst-italic">⚠️ Nu există săli de tip {tip} disponibile în sistem.</p>
      ) : (
        <ul className="list-group">
          {saliTip.map((s, i) => (
            <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
              {s.cod}
              <span className="badge bg-light text-dark">{s.tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
})}


            <h5>👥 Grupe disponibile:</h5>
{!grupe.length ? (
  <p className="text-muted">⚠️ Nu există grupe disponibile în acest moment.</p>
) : (
  <ul className="list-group mb-4">
    {grupe.map((g, i) => (
      <li key={i} className="list-group-item">
        {g.denumire} – {g.nivel}, anul {g.an}, grupa {g.grupa}, subgrupa {g.subgrupa}
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