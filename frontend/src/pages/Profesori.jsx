import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";

const Profesori = () => {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profesorEditat, setProfesorEditat] = useState(null);
  const navigate = useNavigate();

  
const [formular, setFormular] = useState({
  nume: "",
  discipline: [""],
  niveluri: [],
  tipuri: [],
  disponibilitate: {
    Luni: [], Marti: [], Miercuri: [], Joi: [], Vineri: []
  },
});


  const handleFormChange = (field, value) => {
    setFormular({ ...formular, [field]: value });
  };
  const highlight = (text) => {
  const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
  if (index === -1 || !searchTerm) return text;
  return (
    <>
      {text.substring(0, index)}
      <mark>{text.substring(index, index + searchTerm.length)}</mark>
      {text.substring(index + searchTerm.length)}
    </>
  );
};


  const toggleNivel = (nivel) => {
    const niveluri = formular.niveluri.includes(nivel)
      ? formular.niveluri.filter(n => n !== nivel)
      : [...formular.niveluri, nivel];
    setFormular({ ...formular, niveluri });
  };

  const toggleTipActivitate = (tip) => {
    const tipuri = formular.tipuri.includes(tip)
      ? formular.tipuri.filter(t => t !== tip)
      : [...formular.tipuri, tip];
    setFormular({ ...formular, tipuri });
  };

  const handleDisciplinaChange = (index, value) => {
    const discipline = [...formular.discipline];
    discipline[index] = value;
    setFormular({ ...formular, discipline });
  };

  const adaugaDisciplina = () => {
    setFormular({ ...formular, discipline: [...formular.discipline, ""] });
  };

  const stergeDisciplina = (index) => {
    setFormular(prev => ({
      ...prev,
      discipline: prev.discipline.filter((_, i) => i !== index),
    }));
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
        niveluri: typeof p.nivel === "string"
          ? p.nivel.split(",").map(x => x.trim()).filter(Boolean)
          : [],
tipuri: typeof p.tipuri === "string"
  ? p.tipuri.split(",").map(x => x.trim()).filter(x => x !== "")
  : [],
discipline: typeof p.discipline === "string"
  ? p.discipline.split(",").map(x => x.trim()).filter(x => x !== "")
  : [],

        disponibilitate: typeof p.disponibilitate === "string"
          ? JSON.parse(p.disponibilitate)
          : p.disponibilitate || {},
      })));
    }
  } catch (err) {
    console.error("Eroare la fetch:", err);
  }
};


  const handleReincarcareClick = async () => {
  try {
    await fetchProfesori();
    toast.info("🔄 Lista profesorilor a fost reîncărcată cu succes!");
  } catch {
    toast.error("❌ Eroare la reîncărcare profesori.");
  }
};


  useEffect(() => {
    fetchProfesori();
  }, []);

  const adaugaProfesor = async () => {
    const disciplineCurate = formular.discipline.filter((d) => d.trim() !== "");
    if (formular.nume.trim() === "" || disciplineCurate.length === 0 || formular.tipuri.length === 0 || formular.niveluri.length === 0) {
      toast.warning("⚠️ Te rugăm să completezi toate câmpurile.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/adauga_profesor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({
  nume: formular.nume.trim(),
  niveluri: formular.niveluri,
  tipuri: formular.tipuri,
  discipline: disciplineCurate, // sau formular.discipline
  disponibilitate: formular.disponibilitate
}),

      });

      const result = await response.json();
      if (result.success) {
        toast.success("✅ Profesor adăugat!");
        fetchProfesori();
        resetFormular();
      } else {
        toast.error("❌ " + result.error);
      }
    } catch (error) {
      toast.error("❌ Eroare la conexiune.");
    }
    setLoading(false);
  };

  const actualizeazaProfesor = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/actualizeaza_profesor/${profesorEditat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nume: formular.nume.trim(),
          niveluri: formular.niveluri,
          tipuri: formular.tipuri,
          discipline: formular.discipline,
          disponibilitate: formular.disponibilitate
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("🔁 Profesor actualizat!");
        fetchProfesori();
        resetFormular();
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

  const resetFormular = () => {
    setFormular({
  nume: "",
  discipline: [""],
  niveluri: [],
  tipuri: [],
  disponibilitate: {
    Luni: [], Marti: [], Miercuri: [], Joi: [], Vineri: []
  }
});

    setProfesorEditat(null);
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
  Generator Orare
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
        if (result.isConfirmed) fetchProfesori();
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
        if (result.isConfirmed) navigate("/generatedtimetable");
      });
    }}
  >
    ➡ Continuă
  </button>

</div>
        </div>
      </nav>




<div className="d-flex flex-wrap gap-4">
  {/* Col stângă: formularul */}
  <div className="bg-white p-4 shadow-sm rounded" style={{ flex: "1 1 400px" }}>
  <h4 className="mb-4 text-primary fw-bold">
    {profesorEditat ? "🔁 Modifică profesorul existent" : "👨‍🏫 Adaugă un nou profesor"}
  </h4>

  {/* Nume complet */}
  <div className="mb-3">
    <label className="form-label fw-semibold">👤 Nume complet:</label>
    <input
      type="text"
      className={`form-control ${isInvalid(formular.nume) ? "is-invalid" : ""}`}
      value={formular.nume}
      onChange={(e) => handleFormChange("nume", e.target.value)}
      placeholder="ex: Dr. Andrei Popescu"
    />
  </div>

  {/* Nivel de studiu */}
  <div className="mb-3">
    <label className="form-label fw-semibold">🎓 Nivel predare:</label>
    <div className="d-flex gap-3">
      {["Licenta", "Master"].map(nivel => (
        <div key={nivel} className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            checked={formular.niveluri.includes(nivel)}
            onChange={() => toggleNivel(nivel)}
            id={`nivel-${nivel}`}
          />
          <label className="form-check-label" htmlFor={`nivel-${nivel}`}>{nivel}</label>
        </div>
      ))}
    </div>
  </div>

  {/* Tipuri activități */}
  <div className="mb-3">
    <label className="form-label fw-semibold">📚 Tipuri de activitate:</label>
    <div className="d-flex gap-3 flex-wrap">
      {["Curs", "Seminar", "Laborator"].map(tip => (
        <div key={tip} className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            checked={formular.tipuri.includes(tip)}
            onChange={() => toggleTipActivitate(tip)}
            id={`tip-${tip}`}
          />
          <label className="form-check-label" htmlFor={`tip-${tip}`}>{tip}</label>
        </div>
      ))}
    </div>
  </div>

  {/* Discipline predate */}
  <div className="mb-3">
    <label className="form-label fw-semibold">📘 Discipline predate:</label>
    {formular.discipline.map((disc, i) => (
      <div key={i} className="input-group mb-2">
        <input
          type="text"
          className={`form-control ${isInvalid(disc) ? "is-invalid" : ""}`}
          value={disc}
          onChange={(e) => handleDisciplinaChange(i, e.target.value)}
          placeholder={`Disciplină #${i + 1}`}
        />
        {i > 0 && (
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => stergeDisciplina(i)}
            title="Șterge disciplina"
          >
            🗑️
          </button>
        )}
      </div>
    ))}
    <button className="btn btn-sm btn-outline-primary mt-2" onClick={adaugaDisciplina}>
      ➕ Adaugă altă disciplină
    </button>
  </div>




 </div>

  {/* Col dreaptă: disponibilitatea */}
  <div className="bg-white p-4 shadow-sm rounded" style={{ flex: "1 1 600px", minWidth: "350px" }}>
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
    </div>



          <div className="d-flex justify-content-between">
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
        </div>

        {/* Lista profesori */}
        <div className="bg-white p-4 shadow-sm rounded flex-grow-1" style={{ minInlineSize: 400 }}>
          <h5 className="mb-3">📋 Profesori existenți:</h5>



          <input
  type="text"
  className="form-control mb-3"
  placeholder="🔍 Caută profesor după nume..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

{/* Mesaj dacă nu există rezultate */}
{lista.filter(prof => prof.nume.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
  <div className="text-muted fst-italic px-2">Niciun profesor găsit.</div>
)}



          <div className="row">
            {lista
              .filter(prof => prof.nume.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((prof) => (
                <div key={prof.id} className="col-md-6 mb-3">
                  <div className="card shadow-sm h-100">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title text-primary">{prof.nume}</h5>
                      <div className="mb-2"><strong>Nivel:</strong><ul>{prof.niveluri.map((n, i) => <li key={i}>{n}</li>)}</ul></div>
                      <div className="mb-2">
  <strong>Activități:</strong>
  {prof.tipuri.length === 0 ? (
    <p className="fst-italic text-muted">Nicio activitate specificată.</p>
  ) : (
    <ul>{prof.tipuri.map((t, i) => <li key={i}>{t}</li>)}</ul>
  )}
</div>

<div className="mb-2">
  <strong>Discipline:</strong>
  {prof.discipline.length === 0 ? (
    <p className="fst-italic text-muted">Nicio disciplină introdusă.</p>
  ) : (
    <ul>{prof.discipline.map((d, i) => <li key={i}>{d}</li>)}</ul>
  )}
</div>

<div className="mb-2">
  <strong>Disponibilitate:</strong>
  {prof.disponibilitate && Object.keys(prof.disponibilitate).length > 0 ? (
    <ul className="mb-0">
      {Object.entries(prof.disponibilitate).map(([zi, intervale]) => (
        <li key={zi}><strong>{zi}:</strong> {intervale.join(", ")}</li>
      ))}
    </ul>
  ) : (
    <p className="fst-italic text-muted">Nicio disponibilitate setată.</p>
  )}
</div>

                      <div className="d-flex justify-content-end gap-2 mt-auto">
                        <button className="btn btn-sm btn-warning" onClick={() => {
                          setProfesorEditat(prof);
                          setFormular({
                            nume: prof.nume,
                            discipline: prof.discipline,
                            niveluri: prof.niveluri,
                            tipuri: prof.tipuri,
                            disponibilitate: prof.disponibilitate
                          });
                          window.scrollTo({ block: "start", behavior: "smooth" });
                        }}>✏️ Editează</button>
                        <button className="btn btn-sm btn-danger" onClick={() => stergeProfesor(prof.id)}>🗑️ Șterge</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

            {/* Footer */}
      <footer className="bg-light text-center py-4 mt-auto">
        <p className="mb-0">© 2023 Generator Orare. Toate drepturile rezervate.</p>
      </footer>
    </div>
  );
};

export default Profesori;
