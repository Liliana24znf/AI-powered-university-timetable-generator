import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";

const intervaleOrare = [
  "08:00-10:00", "10:00-12:00", "12:00-14:00",
  "14:00-16:00", "16:00-18:00", "18:00-20:00"
];

const Profesori = () => {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profesorEditat, setProfesorEditat] = useState(null);
const [touchedFields, setTouchedFields] = useState({
  nume: false,
  discipline: [],
});


  const navigate = useNavigate();

  const [formular, setFormular] = useState({
    nume: "",
    discipline: [
      {
        denumire: "",
        nivel: "",
        tipuri: [] 
        

      }
    ],
    disponibilitate: {
      Luni: [], Marti: [], Miercuri: [], Joi: [], Vineri: []
    }
  });

  const handleFormChange = (field, value) => {
    setFormular({ ...formular, [field]: value });
  };

  const handleDisciplinaChange = (index, key, value) => {
    const discipline = [...formular.discipline];
    discipline[index][key] = value;
    setFormular({ ...formular, discipline });
  };

  const adaugaDisciplina = () => {
    setFormular({ ...formular, discipline: [...formular.discipline, { denumire: "", nivel: "", tipuri: [] }] });
  };

  const stergeDisciplina = (index) => {
    setFormular(prev => ({
      ...prev,
      discipline: prev.discipline.filter((_, i) => i !== index),
    }));
  };

  const toggleInterval = (zi, interval) => {
    const zile = { ...formular.disponibilitate };
    const index = zile[zi].indexOf(interval);
    if (index >= 0) {
      zile[zi].splice(index, 1);
    } else {
      zile[zi].push(interval);
    }
    setFormular({ ...formular, disponibilitate: zile });
  };

  const isInvalid = (value) => value.trim() === "";

  const fetchProfesori = async () => {
    try {
      const response = await fetch("http://localhost:5000/toti_profesorii");
      const data = await response.json();
      if (Array.isArray(data)) {
        const sorted = data.sort((a, b) => a.nume.localeCompare(b.nume));
        setLista(sorted.map(p => ({
          id: p.id,
          nume: p.nume,
          disponibilitate: typeof p.disponibilitate === "string" ? JSON.parse(p.disponibilitate) : p.disponibilitate || {},
          discipline: Array.isArray(p.discipline) ? p.discipline : []
        })));
      }
    } catch (err) {
      console.error("Eroare la fetch:", err);
    }
  };

  useEffect(() => {
    fetchProfesori();
  }, []);


  const validateFormular = () => {
  let valid = true;

  // Verifică numele
  if (isInvalid(formular.nume)) {
    setTouchedFields(prev => ({ ...prev, nume: true }));
    valid = false;
  }

  // Verifică fiecare disciplină
  const disciplineTouched = [...touchedFields.discipline];
  for (let i = 0; i < formular.discipline.length; i++) {
    const disc = formular.discipline[i];
    if (!disc.denumire || !disc.nivel || !disc.tipuri?.length) {
      disciplineTouched[i] = true;
      valid = false;
    }
  }
  setTouchedFields(prev => ({ ...prev, discipline: disciplineTouched }));

  // Verifică dacă există cel puțin un interval selectat
  const hasDisponibilitate = Object.values(formular.disponibilitate).some(list => list.length > 0);
  if (!hasDisponibilitate) {
    Swal.fire("⚠️ Atenție", "Selectează cel puțin un interval de disponibilitate.", "warning");
    valid = false;
  }

  if (!valid) {
    Swal.fire("⚠️ Atenție", "Te rugăm să completezi toate câmpurile obligatorii.", "warning");
  }

  return valid;
};

const adaugaProfesor = async () => {
  if (!validateFormular()) return;

  setLoading(true);
  try {
    const response = await fetch("http://localhost:5000/adauga_profesor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formular),
    });

    const data = await response.json();

    if (data.success) {
      Swal.fire("✅ Succes", "Profesorul a fost salvat cu succes!", "success");
      fetchProfesori(); // 🔁 Reîncarcă lista profesorilor
      
      resetFormular(); // ♻️ Resetează formularul
      setTouchedFields({
        nume: false,
        discipline: Array(formular.discipline.length).fill(false) // Resetează starea câmpurilor de disciplină
      });
      // Dacă vrei, poți adăuga și resetarea formularului aici
    } else {
      Swal.fire("❌ Eroare", data.message || "A apărut o eroare.", "error");
    }
  } catch (err) {
    Swal.fire("❌ Eroare", "A apărut o eroare la salvare.", "error");
  } finally {
    setLoading(false);
  }
};



  const actualizeazaProfesor = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/actualizeaza_profesor/${profesorEditat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nume: formular.nume.trim(),
          disponibilitate: formular.disponibilitate,
          discipline: formular.discipline
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success("🔁 Profesor actualizat!");
        fetchProfesori();
        resetFormular();
        
        setTouchedFields({
          nume: false,
          discipline: Array(formular.discipline.length).fill(false) // Resetează starea câmpurilor de disciplină
        });
        
        setProfesorEditat(null);
      } else {
        toast.error("❌ " + result.error);
      }
    } catch (error) {
      toast.error("❌ Eroare la conexiune.");
    }
    setLoading(false);
  };

  const stergeProfesor = async (id) => {
    const confirm = await Swal.fire({
      title: "Ești sigur?",
      text: "Profesorul va fi șters definitiv.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Da, șterge!",
      cancelButtonText: "Anulează",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/sterge_profesor/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (result.success) {
        toast.success("✅ Profesor șters!");
        fetchProfesori();
      } else {
        toast.error("❌ " + result.error);
      }
    } catch (error) {
      toast.error("❌ Eroare la conexiune.");
    }
    setLoading(false);
  };

const handleBlur = (field) => {
  setTouchedFields((prev) => ({ ...prev, [field]: true }));
};


const handleBlurDisciplina = (index) => {
  setTouchedFields((prev) => {
    const updated = [...prev.discipline];
    updated[index] = true;
    return { ...prev, discipline: updated };
  });
};




  const resetFormular = () => {
    setFormular({
      nume: "",
      discipline: [{ denumire: "", nivel: "", tipuri: [] }],
      disponibilitate: {
        Luni: [], Marti: [], Miercuri: [], Joi: [], Vineri: []
      }
    });
    setProfesorEditat(null);
  };
const toggleTipActivitate = (index, tip) => {
  const discipline = [...formular.discipline];
  const tipuri = discipline[index].tipuri || [];

  if (tipuri.includes(tip)) {
    discipline[index].tipuri = tipuri.filter(t => t !== tip);
  } else {
    discipline[index].tipuri = [...tipuri, tip];
  }

  setFormular({ ...formular, discipline });
};

  return (
    <div className="container-fluid pt-4 px-4">
      <ToastContainer />

      <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 mb-4">
        <div className="container-fluid position-relative d-flex justify-content-center align-items-center">
<button
  type="button"
  className="position-absolute start-0 text-primary fw-bold fs-4 text-decoration-none btn btn-link p-0"
  style={{ cursor: "pointer" }}
  onClick={() => {
    Swal.fire({
      title: "Părăsești această pagină?",
      text: "Datele nesalvate despre profesori vor fi pierdute. Ești sigur că vrei să revii la pagina de început?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Da, sunt sigur(ă)",
      cancelButtonText: "Rămâi aici"
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/dashboard");
      }
    });
  }}
>
  <span className="fs-6 fw-bold">Aplicație pentru planificare inteligentă</span>
  <span className="fs-6 m-0 d-flex flex-column align-items-start justify-content-center text-decoration-none">utilizând tehnici de A.I.</span>
</button>

          <span className="text-primary fw-bold fs-4">👨‍🏫 Gestionare Profesori</span>
          <div className="position-absolute end-0 d-flex gap-2">
            <button
    className="btn btn-outline-danger"
    onClick={() => {
      Swal.fire({
        title: "Revenire la săli?",
        text: "Datele nesalvate despre profesori vor fi pierdute. Ești sigur că vrei să revii?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Da, revin",
        cancelButtonText: "Rămân aici",
      }).then((result) => {
        if (result.isConfirmed) navigate("/grupe");
      });
    }}
  >
    🔙 Înapoi
  </button>

<button
  className="btn btn-outline-secondary"
  onClick={() => {
    Swal.fire({
      title: "Reîncarcă profesorii?",
      text: "Profesorii actuali vor fi reîncărcați din baza de date. Modificările nesalvate vor fi pierdute.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Da, reîncarcă",
      cancelButtonText: "Nu",
    }).then((result) => {
      if (result.isConfirmed) {
        fetchProfesori();      // 🔄 Reîncarcă din backend
        resetFormular();       // ♻️ Golește formularul
        setProfesorEditat(null); // 🔚 Dezactivează modul editare
        setSearchTerm("");      // 🔄 Resetează termenul de căutare
        setTouchedFields({
          nume: false,
          discipline: Array(formular.discipline.length).fill(false) // Resetează starea câmpurilor de disciplină
        });
        toast.info("🔄 Lista profesorilor a fost reîncărcată.");      // ℹ️ Afișează mesaj de informare
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
        title: "Continui către reguli?",
        text: "Asigură-te că ai salvat toți profeosrii înainte de a continua.",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Da, continuă",
        cancelButtonText: "Rămân aici",
      }).then((result) => {
        if (result.isConfirmed) navigate("/setare-reguli");
        else {
          toast.info("🔄 Rămâi aici pentru a adăuga sau modifica profesori.");
        }
      });
    }}
  >
    ➡ Continuă
  </button>

      </div>
      </div>
      </nav>

      <div className="row mb-4">
  <div className="col-md-8 mx-auto">
    <div className="bg-white border-start border-4 border-primary p-4 rounded shadow-sm">
      <h4 className="fw-bold text-primary mb-3">👨‍🏫 Despre gestionarea profesorilor</h4>
      <p className="text-secondary mb-2">
        În această secțiune poți introduce <strong>profesorii disponibili</strong> pentru activitățile didactice: <strong>cursuri</strong>, <strong>seminarii</strong> și <strong>laboratoare</strong>.
      </p>
      <p className="text-secondary mb-2">
        Fiecare profesor trebuie să aibă completate informațiile despre <strong>nume</strong>, <strong>disciplinele predate</strong> (cu nivel și tip de activitate) și <strong>disponibilitatea săptămânală</strong>.
      </p>
      <p className="text-secondary mb-2">
        Apasă <strong>"Salvează profesor"</strong> pentru a adăuga un nou profesor în sistem.
      </p>
      <p className="text-secondary">
        Poți folosi <strong>"Reîncarcă"</strong> pentru a actualiza lista profesorilor și a vizualiza ultimele modificări efectuate.
      </p>
    </div>
  </div>
</div>


<div className="d-flex flex-wrap gap-4">
  {/* Col stângă: formularul */}
  <div className="bg-white p-4 shadow-sm rounded" style={{ flex: "1 1 400px" }}>
  <h4 className="mb-4 text-primary fw-bold">
    {profesorEditat ? "🔁 Modifică profesorul existent" : "👨‍🏫 Adaugă un nou profesor"}
  </h4>

<div className="mb-3">
  <label className="form-label fw-semibold">👤 Nume complet:</label>
  <input
    type="text"
    className={`form-control ${touchedFields.nume && isInvalid(formular.nume) ? "is-invalid" : ""}`}
    value={formular.nume}
    onChange={(e) => handleFormChange("nume", e.target.value)}
    onBlur={() => handleBlur("nume")}
    placeholder="ex: Dr. Andrei Popescu"
  />
  {touchedFields.nume && isInvalid(formular.nume) && (
    <div className="invalid-feedback">
      Numele profesorului este obligatoriu.
    </div>
  )}
</div>


<div className="mb-3">
  <label className="form-label fw-semibold">📘 Discipline predate:</label>

  {formular.discipline.map((disc, i) => (
    <div key={i} className="card border-0 shadow-sm mb-3">
      <div className="card-body d-flex flex-wrap align-items-center gap-3">

        <input
  type="text"
  className={`form-control ${
    touchedFields.discipline[i] && !disc.denumire ? "is-invalid" : ""
  }`}
  placeholder="Denumire disciplină"
  value={disc.denumire}
  onChange={(e) => handleDisciplinaChange(i, "denumire", e.target.value)}
  onBlur={() => handleBlurDisciplina(i)}
/>
{touchedFields.discipline[i] && !disc.denumire && (
  <div className="invalid-feedback">
    Denumirea disciplinei este obligatorie.
  </div>
)}


        <select
          className="form-select"
          value={disc.nivel}
          onChange={(e) => handleDisciplinaChange(i, "nivel", e.target.value)}
          style={{ minInlineSize: 130 }}
        >
          <option value="">Selectează nivel</option>
          <option value="Licenta">Licenta</option>
          <option value="Master">Master</option>
        </select>

        <div className="d-flex gap-3 flex-wrap">
          {["Curs", "Seminar", "Laborator", "Proiect"].map(tip => (
            <div key={tip} className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id={`tip-${i}-${tip}`}
                checked={disc.tipuri?.includes(tip)}
                onChange={() => toggleTipActivitate(i, tip)}
              />
              <label className="form-check-label" htmlFor={`tip-${i}-${tip}`}>
                {tip}
              </label>
            </div>
          ))}
        </div>

        {i > 0 && (
          <button
            type="button"
            className="btn btn-outline-danger btn-sm ms-auto"
            onClick={() => stergeDisciplina(i)}
            title="Șterge disciplina"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  ))}

  <button className="btn btn-sm btn-outline-primary mt-2" onClick={adaugaDisciplina}>
    ➕ Adaugă altă disciplină
  </button>
</div>


 </div>


  {/* Col dreaptă: disponibilitatea */}
  <div className="bg-white p-4 shadow-sm rounded" style={{ flex: "1 1 600px", minInlineSize: "350px" }}>
    <label className="form-label fw-bold">📅 Disponibilitate săptămânală</label>
    <p className="text-muted mb-3">
      Selectează zilele și intervalele orare în care profesorul este disponibil.<br />
      Click pe o celulă pentru a o activa/dezactiva.
    </p>

    <div className="table-responsive">
      <table className="table table-bordered text-center align-middle shadow-sm">
        <thead className="table-primary">
          <tr>
            <th className="bg-light">🕓 Zile / Interval</th>
            {["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00", "18:00-20:00"].map(interval => (
              <th key={interval} className="small">{interval}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {["Luni", "Marti", "Miercuri", "Joi", "Vineri"].map(zi => (
            <tr key={zi}>
              <td className="fw-semibold bg-light">{zi}</td>
              {["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00", "18:00-20:00"].map(interval => {
                const esteSelectat = formular.disponibilitate[zi]?.includes(interval);
                return (
                  <td
                    key={interval}
                    className={`cursor-pointer ${esteSelectat ? 'bg-success text-white fw-bold' : 'bg-white'} hover-shadow`}
                    style={{ transition: "0.2s", userSelect: "none" }}
                    onClick={() => {
                      const curente = formular.disponibilitate[zi] || [];
                      const actualizat = curente.includes(interval)
                        ? curente.filter(i => i !== interval)
                        : [...curente, interval];
                      setFormular({
                        ...formular,
                        disponibilitate: {
                          ...formular.disponibilitate,
                          [zi]: actualizat
                        }
                      });
                    }}
                  >
                    {esteSelectat ? "✔️" : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-end mt-3">
  <button
    className="btn btn-sm btn-outline-primary mt-2"
    onClick={() => {
      setFormular(prev => ({
        ...prev,
        disponibilitate: {
          Luni: [],
          Marti: [],
          Miercuri: [],
          Joi: [],
          Vineri: []
        }
      }));
    }}
  >
    🔄 Resetează disponibilitatea
  </button>
</div>

    </div>

        </div>

          

      </div>


<div className="d-flex justify-content-between mt-4">
            {profesorEditat ? (
              <>
                <button className="btn btn-warning" onClick={actualizeazaProfesor} disabled={loading}>
                  {loading ? "Actualizare..." : "🔁 Actualizează"}
                </button>
                <button className="btn btn-outline-secondary" onClick={resetFormular}>❌ Anulează</button>
              </>
            ) : (
              <>
                <button className="btn btn-success" onClick={adaugaProfesor} disabled={loading}>
  {loading ? "Salvare..." : "✅ Salvează profesor"}
</button>

                <button className="btn btn-outline-secondary" onClick={resetFormular}>🔄 Resetare</button>
              </>
            )}
          </div>

          <div className="bg-white p-4 shadow-sm rounded flex-grow-1" style={{ minInlineSize: 400 }}>
  <h5 className="mb-3">📋 Profesori existenți:</h5>

  <input
    type="text"
    className="form-control mb-3"
    placeholder="🔍 Caută profesor după nume..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />

  {lista.filter(prof => prof.nume.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
    <div className="text-muted fst-italic px-2">Niciun profesor găsit.</div>
  )}

  <div className="row">
    {lista
      .filter(prof => prof.nume.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((prof) => (
        <div key={prof.id} className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title text-primary fw-semibold mb-2">
                👨‍🏫 {prof.nume}
              </h5>

              <div className="mb-2">
                <strong>📚 Discipline:</strong>
                {prof.discipline?.length === 0 ? (
                  <p className="fst-italic text-muted">Nicio disciplină introdusă.</p>
                ) : (
                  <div className="d-flex flex-wrap gap-2 mt-1">
{prof.discipline.map((d, i) => (
  <span
    key={i}
    className="badge text-bg-light border border-primary-subtle px-3 py-2"
  >
    {d.denumire} – <span className="text-info">{d.tipuri?.join(", ")}</span>{" "}
    <small className="text-muted">({d.nivel})</small>
  </span>
))}


                  </div>
                )}
              </div>

              <div className="mb-2">
                <strong>🕒 Disponibilitate:</strong>
                {prof.disponibilitate && Object.keys(prof.disponibilitate).length > 0 ? (
                  <ul className="mb-0 mt-1 ps-3">
                    {["Luni", "Marti", "Miercuri", "Joi", "Vineri"].map((zi) => (
  <li key={zi}>
    <strong>{zi}:</strong>{" "}
    {prof.disponibilitate?.[zi]?.length > 0
      ? prof.disponibilitate[zi].join(", ")
      : <span className="text-muted fst-italic">Nu este disponibil(ă)</span>}
  </li>
))}

                  </ul>
                ) : (
                  <p className="fst-italic text-muted">Nicio disponibilitate setată.</p>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2 mt-auto pt-3">
  <button
    className="btn btn-outline-warning btn-sm"
    onClick={() => {
      setProfesorEditat(prof);

      // Deep copy pentru a preveni mutarea referinței directe
      const disciplineCopiate = prof.discipline.map(d => ({
        denumire: d.denumire || "",
        nivel: d.nivel || "",
        tipuri: d.tipuri || []
      }));

      setFormular({
        nume: prof.nume || "",
        discipline: disciplineCopiate,
        disponibilitate: prof.disponibilitate || {}
      });

      // Opțional: Resetează stările de validare, dacă ai
      // setTouched(false);

      // Derulare sus
      window.scrollTo({ top: 0, behavior: "smooth" });
    }}
  >
    <span className="text-warning">✏️</span> Editează
  </button>

  <button
    className="btn btn-sm btn-danger"
    onClick={() => stergeProfesor(prof.id)}
  >
    🗑️ Șterge
  </button>
</div>

            </div>
          </div>
        </div>
      ))}
  </div>




{/* Footer */}
<footer className="bg-light text-center py-4 mt-auto">
  <p className="mb-0">© 2023 Generator Orare. Toate drepturile rezervate.</p>
</footer>
</div>
</div>
  );
};

export default Profesori;
