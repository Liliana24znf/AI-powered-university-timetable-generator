import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const SetareReguli = () => {
  const navigate = useNavigate();
 


const regulaVizibila = `✅ OBIECTIV:
Completează orarul pentru TOATE grupele și subgrupele de la Licență și Master, pentru întreaga săptămână (Luni–Vineri), fără a omite vreo grupă sau vreo zi.

📌 STRUCTURARE ACTIVITĂȚI:
- Cursurile se desfășoară cu **anul**.
- Seminarele și proiectele se desfășoară cu **grupa**.
- Laboratoarele se desfășoară cu **subgrupa**.

🕓 INTERVALE ORARE DISPONIBILE:
- "08:00–10:00", "10:00–12:00", "12:00–14:00", "14:00–16:00", "16:00–18:00", "18:00–20:00"

📅 PROGRAM ZILNIC:
- **Licență**: 08:00–20:00
- **Master**: 16:00–20:00
- Fiecare zi trebuie să conțină între **4 și 8 ore** de activități (adică 2–4 activități a câte 2 ore).
- **Maxim o pauză (2h) pe zi.** Evită ferestrele, dar dacă nu se poate (din lipsă de sală/profesor), pauza se încadrează în cele 8h/zi.

📛 RESTRICȚII:
- Miercuri, modulul 4 (**14:00–16:00**) este liber pentru TOATE grupele.
- **O sală nu poate fi folosită de mai multe activități simultan.**
- **Sălile NU se folosesc simultan de licență și master în același interval.**

🏫 SĂLI DISPONIBILE:
- Cursuri → prefix **GC** (ex: GC1)
- Seminare → prefix **GS** (ex: GS2)
- Laboratoare → prefix **GL** (ex: GL3)
- Proiecte → prefix **GP** (ex: GP1)

🧠 FORMAT ACTIVITĂȚI:
- **Cursuri**: denumirea completă + prescurtare + profesor + sală  
  Ex: „Programare (PR) – Ion Popescu – GC1”
- **Seminar/Proiect/Laborator**: acronim disciplină + profesor + sală  
  Ex: „PR – Ion Popescu – GL2”
`;

const instructiuniGPT = `
🚫 NU inventa date. Folosește doar: profesori, discipline și săli furnizate.

🧾 STRUCTURĂ JSON:
{
  "Licenta": {
    "I1a": {
      "Luni": {
        "08:00–10:00": {
          "activitate": "Programare (PR)",
          "tip": "Curs",
          "profesor": "Ion Popescu",
          "sala": "GC1"
        }
      }
    }
  },
  "Master": {
    "M1a": { ... }
  }
}

⚠️ Fiecare activitate TREBUIE să conțină:
- "activitate": Denumirea
- "tip": Curs / Seminar / Laborator / Proiect
- "profesor": Nume complet
- "sala": Cod sală (ex: GC1, GL2)

‼️ NU omite nicio zi. Fiecare grupă/subgrupă are activități în fiecare zi (cu excepția miercuri 14:00–16:00).

🔐 FINAL:
{"role": "system", "content": "Răspunde DOAR cu JSON VALID. Nu folosi comentarii sau simboluri nepermise. Începe cu { și termină cu }."}
`;


 const [reguli, setReguli] = useState(regulaVizibila);
 
  const [loading, setLoading] = useState(false);

  const [ultimeleReguli, setUltimeleReguli] = useState([]);
const [numeRegula, setNumeRegula] = useState("");

useEffect(() => {
  const incarcaUltimeleReguli = async () => {
    try {
      const response = await fetch("http://localhost:5000/ultimele_reguli");
      const data = await response.json();
      console.log("Reguli primite:", data); // ✅ vezi în consola browserului
      setUltimeleReguli(data);
    } catch (err) {
      console.error("Eroare la încărcarea regulilor:", err);
    }
  };
  incarcaUltimeleReguli();
}, []);


const salveazaReguli = async () => {
  try {
    setLoading(true);
    const response = await fetch("http://localhost:5000/salveaza_reguli", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reguli,
        denumire: numeRegula, // ← AICI adăugăm și titlul
      }),
    });

    const data = await response.json();
    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Regulile au fost salvate",
        showConfirmButton: false,
        timer: 1500,
      });
    } else {
      throw new Error(data.error || "Eroare necunoscută");
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Eroare la salvare",
      text: error.message,
    });
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="container-fluid pt-4 px-4">
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 mb-4">
        <div className="container-fluid position-relative d-flex justify-content-center align-items-center">
          <button
            type="button"
            className="position-absolute start-0 text-primary fw-bold fs-4 text-decoration-none btn btn-link p-0"
            style={{ cursor: "pointer" }}
            onClick={() => {
              Swal.fire({
                title: "Revii la profesori?",
                text: "Datele nesalvate vor fi pierdute. Vrei să revii la pagina profesori?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Da, revino",
                cancelButtonText: "Rămân aici"
              }).then((result) => {
                if (result.isConfirmed) {
                  navigate("/profesori");
                }
              });
            }}
          >
            Generator Orare
          </button>

          <span className="text-primary fw-bold fs-4">🧠 Setare Reguli</span>

          <div className="position-absolute end-0 d-flex gap-2">
            <button
              className="btn btn-outline-danger"
              onClick={() => {
                Swal.fire({
                  title: "Revenire la profesori?",
                  text: "Datele nesalvate vor fi pierdute.",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Da, revin",
                  cancelButtonText: "Rămân aici",
                }).then((result) => {
                  if (result.isConfirmed) navigate("/profesori");
                });
              }}
            >
              🔙 Înapoi
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                Swal.fire({
                  title: "Reîncarci pagina?",
                  text: "Toate modificările nesalvate vor fi pierdute.",
                  icon: "question",
                  showCancelButton: true,
                  confirmButtonText: "Da, reîncarcă",
                  cancelButtonText: "Nu",
                }).then((result) => {
                  if (result.isConfirmed) {
                    window.location.reload();
                  }
                });
              }}
            >
              🔄 Reîncarcă
            </button>

            <button
              className="btn btn-outline-primary"
              onClick={() => {
                Swal.fire({
                  title: "Salvezi regulile și continui?",
                  text: "Veți fi redirecționat către pagina de generare orar.",
                  icon: "info",
                  showCancelButton: true,
                  confirmButtonText: "Da, continuă",
                  cancelButtonText: "Rămân aici",
                }).then((result) => {
                  if (result.isConfirmed) salveazaReguli();
                });
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Se salvează...
                </>
              ) : (
                "✅ Continuă"
              )}
            </button>
          </div>
        </div>
      </nav>
<div className="row mb-4">
  <div className="col-md-8 mx-auto">
    <div className="bg-white border-start border-4 border-primary p-4 rounded shadow-sm">
      <h4 className="fw-bold text-primary mb-3">📋 Despre setarea regulilor</h4>
      <p className="text-secondary mb-2">
        În această secțiune poți introduce <strong>regulile care guvernează generarea orarului</strong> pentru toate grupele și subgrupele din învățământul de <strong>Licență</strong> și <strong>Masterat</strong>.
      </p>
      <p className="text-secondary mb-2">
        Regulile trebuie să includă informații clare despre <strong>structura activităților</strong> (curs, seminar, laborator), <strong>intervalele orare permise</strong>, <strong>restricții de săli</strong> și <strong>programul zilnic</strong> pentru fiecare nivel.
      </p>
      <p className="text-secondary mb-2">
        După completare, apasă <strong>"Salvează și continuă"</strong> pentru a înregistra regulile în baza de date și a trece la generarea orarului.
      </p>
      <p className="text-secondary">
        Poți folosi <strong>"Reîncarcă"</strong> pentru a reseta pagina în cazul în care dorești să reîncepi editarea regulilor de la zero.
      </p>
    </div>
  </div>
</div>

      {/* CONȚINUT */}
      <div className="container-lg">
        {/* TEXTAREA */}
<div className="card border-0 shadow-sm mb-5">
  <div className="card-header bg-primary text-white fw-bold">
    📜 REGULI STRICTE PENTRU GENERAREA ORARULUI
  </div>
  <div className="card-body p-0">
    <textarea
      className="form-control"
    style={{
  fontFamily: "Fira Code, monospace",
  whiteSpace: "pre-wrap",
  backgroundColor: "#f9f9f9",
  border: "none",
  borderRadius: "0 0 0.375rem 0.375rem",
  padding: "1.5rem",
  minHeight: "500px", // ✅ în loc de minBlockSize
  lineHeight: "1.6",  // ✅ în loc de lineblock-size
  fontSize: "0.95rem",
  borderLeft: "5px dotted #0d6efd", // ✅ în loc de borderinset-inline-start
  borderTop: "1px solid #dee2e6"    // ✅ în loc de borderinset-block-start
}}

      rows={20}
      placeholder="📜 Introdu aici regulile..."
      value={reguli}
      onChange={(e) => setReguli(e.target.value)}
    />

    <div className="mb-3">
  <label className="form-label fw-bold">📝 Denumire regulă salvată</label>
  <input
    type="text"
    className="form-control"
    placeholder="Ex: Reguli examen vară"
    value={numeRegula}
    onChange={(e) => setNumeRegula(e.target.value)}
  />
</div>

        {/* BUTOANE */}
        <div className="d-flex gap-2 mb-5">
          <button className="btn btn-success" onClick={salveazaReguli} disabled={loading}>
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Se salvează...
              </>
            ) : (
              "🚀 Salvează"
            )}
          </button>
          <button
            className="btn btn-outline-danger"
            onClick={() => {
              Swal.fire({
                title: "Ești sigur?",
                text: "Regulile vor fi șterse complet.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Da, șterge",
                cancelButtonText: "Anulează",
              }).then((result) => {
                if (result.isConfirmed) setReguli("");
              });
            }}
          >
            🔄 Golește
          </button>
        </div>



{ultimeleReguli.length > 0 && (
  <div className="mb-4">
    <h5 className="text-primary">📂 Încarcă reguli salvate</h5>
    <ul className="list-group">
      {ultimeleReguli.map((r) => (
        <li
          key={r.id}
          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
          style={{ cursor: "pointer" }}
          onClick={() => {
            Swal.fire({
              title: "Încarci această regulă?",
              text: `Titlu: ${r.denumire}\nData: ${new Date(r.data_adaugare).toLocaleString()}`,
              icon: "question",
              showCancelButton: true,
              confirmButtonText: "Da, încarcă",
              cancelButtonText: "Nu",
            }).then((result) => {
              if (result.isConfirmed) setReguli(r.continut);
            });
          }}
        >
          <span>{r.denumire}</span>
          <small className="text-muted">{new Date(r.data_adaugare).toLocaleString()}</small>
        </li>
      ))}
    </ul>
  </div>
)}

  </div>
</div>



      </div>

      {/* FOOTER */}
      <footer className="bg-white text-center text-muted py-3 border-top mt-auto">
        <p className="mb-0">© {new Date().getFullYear()} Generator Orare – Setare Reguli</p>
      </footer>
    </div>
  );
};

export default SetareReguli;
