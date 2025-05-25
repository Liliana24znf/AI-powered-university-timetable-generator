import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";

const Profesori = () => {
  const [lista, setLista] = useState([]);
  const [formular, setFormular] = useState({
    nume: "",
    discipline: [""],
    nivel: "Licenta",
    tipuri: [],
  });

  const navigate = useNavigate();

  const handleFormChange = (field, value) => {
    setFormular({ ...formular, [field]: value });
  };

  const handleDisciplinaChange = (index, value) => {
    const discipline = [...formular.discipline];
    discipline[index] = value;
    setFormular({ ...formular, discipline });
  };

  const adaugaDisciplina = () => {
    setFormular({ ...formular, discipline: [...formular.discipline, ""] });
  };

  const toggleTipActivitate = (tip) => {
    const tipuri = formular.tipuri.includes(tip)
      ? formular.tipuri.filter((t) => t !== tip)
      : [...formular.tipuri, tip];
    setFormular({ ...formular, tipuri });
  };

  const adaugaProfesor = async () => {
    const disciplineCurate = formular.discipline.filter((d) => d.trim() !== "");
    const tipuriCurate = formular.tipuri;

    if (formular.nume.trim() === "" || disciplineCurate.length === 0 || tipuriCurate.length === 0) {
      toast.warning("⚠️ Te rugăm să completezi toate câmpurile.");
      return;
    }

    const dateTrimise = {
      nume: formular.nume.trim(),
      nivel: formular.nivel,
      tipuri: tipuriCurate,
      discipline: disciplineCurate,
    };

    try {
      const response = await fetch("http://localhost:5000/adauga_profesor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dateTrimise),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("✅ Profesor adăugat cu succes!");
        fetchProfesori();
        setFormular({ nume: "", discipline: [""], nivel: "Licenta", tipuri: [] });
      } else {
        toast.error("❌ Eroare: " + result.error);
      }
    } catch (error) {
      toast.error("❌ Eroare la conexiune.");
      console.error(error);
    }
  };

  const stergeProfesor = async (id) => {
    const confirm = await Swal.fire({
      title: "Ești sigur?",
      text: "Profesorul va fi șters definitiv.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Da, șterge!",
      cancelButtonText: "Anulează",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:5000/sterge_profesor/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        toast.success("✅ Profesor șters!");
        fetchProfesori();
      } else {
        toast.error("❌ " + result.error);
      }
    } catch (error) {
      toast.error("❌ Eroare la conexiune.");
      console.error(error);
    }
  };

  const stergeDisciplina = (index) => {
    setFormular((prev) => ({
      ...prev,
      discipline: prev.discipline.filter((_, i) => i !== index),
    }));
  };

  const fetchProfesori = async () => {
    try {
      const response = await fetch("http://localhost:5000/toti_profesorii");
      const data = await response.json();
      if (Array.isArray(data)) {
        setLista(
          data.map((p) => ({
            id: p.id,
            nume: p.nume,
            nivel: p.nivel,
            tipuri: p.tipuri.split(", "),
            discipline: p.discipline.split(", "),
          }))
        );
      }
    } catch (err) {
      console.error("Eroare la fetch:", err);
    }
  };

  useEffect(() => {
    fetchProfesori();
  }, []);

  const handleNext = () => {
    navigate("/orar-generat", { state: { profesori: lista } });
  };

  return (
    <div className="container-fluid pt-4 px-4">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 w-100 mb-4">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <Link to="/" className="navbar-brand text-primary fw-bold fs-4">
            Generator Orare
          </Link>
          <div>
            <button className="btn btn-outline-primary me-2" onClick={fetchProfesori}>
              🔄 Reîncarcă
            </button>
            <button className="btn btn-primary" onClick={handleNext}>
              ➡ Continuă
            </button>
          </div>
        </div>
      </nav>

      {/* CONȚINUT */}
      <div className="d-flex flex-wrap gap-4">
        {/* Formular */}
        <div className="bg-white p-4 shadow-sm rounded" style={{ flex: "1 1 400px" }}>
          <h4 className="mb-4 text-primary fw-bold">👨‍🏫 Adaugă Profesor</h4>

          <div className="mb-4">
            <label className="form-label fw-semibold">Nume complet:</label>
            <input
              type="text"
              className="form-control"
              placeholder="ex: Ion Popescu"
              value={formular.nume}
              onChange={(e) => handleFormChange("nume", e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Nivel de predare:</label>
            <select
              className="form-select"
              value={formular.nivel}
              onChange={(e) => handleFormChange("nivel", e.target.value)}
            >
              <option value="Licenta">Licență</option>
              <option value="Master">Master</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">
              Tipuri de activitate: <span className="text-muted small">(poți selecta mai multe)</span>
            </label>
            <div className="d-flex flex-wrap gap-3 mt-2">
              {["Curs", "Seminar", "Laborator"].map((tip) => (
                <div key={tip} className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={formular.tipuri.includes(tip)}
                    onChange={() => toggleTipActivitate(tip)}
                    id={`tip-${tip}`}
                  />
                  <label className="form-check-label" htmlFor={`tip-${tip}`}>
                    {tip}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Discipline predate:</label>
            {formular.discipline.map((disc, i) => (
              <div key={i} className="input-group mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Disciplină #${i + 1}`}
                  value={disc}
                  onChange={(e) => handleDisciplinaChange(i, e.target.value)}
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
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mt-2"
              onClick={adaugaDisciplina}
            >
              ➕ Adaugă disciplină
            </button>
          </div>

          <div className="d-flex justify-content-between mt-4">
            <button className="btn btn-success" onClick={adaugaProfesor}>
              ✅ Salvează profesor
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() =>
                setFormular({ nume: "", discipline: [""], nivel: "Licenta", tipuri: [] })
              }
            >
              🔄 Resetare
            </button>
          </div>
        </div>

        {/* Listă Profesori */}
        <div className="bg-white p-4 shadow-sm rounded flex-grow-1" style={{ minWidth: 400 }}>
          <h5 className="mb-3">📋 Profesori existenți:</h5>
          {lista.length === 0 ? (
            <p className="text-muted">Nu există profesori.</p>
          ) : (
            <div className="row">
              {lista.map((prof) => (
                <div key={prof.id} className="col-md-6 mb-3">
                  <div className="border rounded p-3 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <strong>{prof.nume}</strong> – {prof.nivel}
                      <div className="mt-2">
                        {prof.tipuri.map((t, i) => (
                          <span key={i} className="badge bg-primary me-1 mb-1">{t}</span>
                        ))}
                        {prof.discipline.map((d, i) => (
                          <span key={i} className="badge bg-secondary me-1 mb-1">{d}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-danger mt-3 align-self-end"
                      onClick={() => stergeProfesor(prof.id)}
                    >
                      🗑️ Șterge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white text-center text-muted py-3 border-top mt-4">
        <p className="mb-0">&copy; {new Date().getFullYear()} Generator Orare • Toate drepturile rezervate.</p>
      </footer>
    </div>
  );
};

export default Profesori;
