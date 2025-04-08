import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
    const alreadySelected = formular.tipuri.includes(tip);
    setFormular({
      ...formular,
      tipuri: alreadySelected
        ? formular.tipuri.filter((t) => t !== tip)
        : [...formular.tipuri, tip],
    });
  };

  const adaugaProfesor = async () => {
    const disciplineCurate = formular.discipline.filter((d) => d.trim() !== "");
    const tipuriCurate = formular.tipuri;

    if (formular.nume.trim() === "" || disciplineCurate.length === 0 || tipuriCurate.length === 0) {
      alert("Te rog completează toate câmpurile obligatorii.");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dateTrimise),
      });

      const result = await response.json();
      console.log("Răspuns de la server:", result);

      if (result.success) {
        alert("✅ Profesor salvat cu succes!");
        fetchProfesori(); // actualizează lista din baza de date
        setFormular({
          nume: "",
          discipline: [""],
          nivel: "Licenta",
          tipuri: [],
        });
      } else {
        alert("Eroare la salvare: " + result.error);
      }
    } catch (error) {
      console.error("Eroare la trimitere:", error);
      alert("Conexiune eșuată cu backend-ul.");
    }
  };

  const stergeProfesor = (index) => {
    const confirmare = window.confirm("Ești sigur că vrei să ștergi acest profesor?");
    if (!confirmare) return;

    const updated = [...lista];
    updated.splice(index, 1);
    setLista(updated);
  };

  const handleNext = () => {
    navigate("/orar-generat", { state: { profesori: lista } });
  };

  const fetchProfesori = async () => {
    try {
      const response = await fetch("http://localhost:5000/toti_profesorii");
      const data = await response.json();
      if (Array.isArray(data)) {
        setLista(data.map(p => ({
          nume: p.nume,
          nivel: p.nivel,
          tipuri: p.tipuri.split(", "),
          discipline: p.discipline.split(", ")
        })));
      }
    } catch (err) {
      console.error("Eroare la încărcarea profesorilor:", err);
    }
  };

  useEffect(() => {
    fetchProfesori();
  }, []);

  return (
    <div className="container mt-4">
      <h3>📘 Adaugă Profesori</h3>

      {/* Formular */}
      <div className="card mb-4 p-3 shadow-sm">
        <div className="mb-2">
          <label className="form-label">Nume profesor:</label>
          <input
            className="form-control"
            value={formular.nume}
            onChange={(e) => handleFormChange("nume", e.target.value)}
            placeholder="Ex: Ionescu Maria"
          />
        </div>

        <div className="mb-2">
          <label className="form-label">Nivel:</label>
          <select
            className="form-select"
            value={formular.nivel}
            onChange={(e) => handleFormChange("nivel", e.target.value)}
          >
            <option value="Licenta">Licență</option>
            <option value="Master">Master</option>
          </select>
        </div>

        <div className="mb-2">
          <label className="form-label">Tip activitate:</label>
          {["Curs", "Seminar", "Laborator"].map((tip) => (
            <div key={tip} className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="checkbox"
                checked={formular.tipuri.includes(tip)}
                onChange={() => toggleTipActivitate(tip)}
              />
              <label className="form-check-label">{tip}</label>
            </div>
          ))}
        </div>

        <div className="mb-2">
          <label className="form-label">Discipline:</label>
          {formular.discipline.map((disc, i) => (
            <input
              key={i}
              className="form-control mb-1"
              value={disc}
              onChange={(e) => handleDisciplinaChange(i, e.target.value)}
              placeholder={`Disciplină #${i + 1}`}
            />
          ))}
          <button
            className="btn btn-sm btn-outline-secondary mt-2"
            onClick={adaugaDisciplina}
          >
            + Adaugă disciplină
          </button>
        </div>

        <div className="d-flex justify-content-between mt-3">
          <button className="btn btn-success" onClick={adaugaProfesor}>
            ✅ Salvează profesor
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() =>
              setFormular({ nume: "", discipline: [""], nivel: "Licenta", tipuri: [] })
            }
          >
            🔄 Resetare formular
          </button>
        </div>
      </div>

      {/* Listă profesori */}
      {lista.length > 0 && (
        <div className="card p-3 shadow-sm" id="lista-profesori">
          <h5>📋 Profesori adăugați:</h5>
          <ul className="list-group">
            {lista.map((prof, index) => (
              <li
                key={index}
                className="list-group-item d-flex justify-content-between align-items-start flex-column"
              >
                <div>
                  <strong>{prof.nume}</strong> – {prof.nivel}
                </div>
                <div className="mt-1">
                  {prof.tipuri.map((tip, idx) => (
                    <span key={idx} className="badge bg-primary me-1">
                      {tip}
                    </span>
                  ))}
                  {prof.discipline.map((disc, idx) => (
                    <span key={idx} className="badge bg-secondary me-1">
                      {disc}
                    </span>
                  ))}
                </div>
                <button
                  className="btn btn-sm btn-danger mt-2 align-self-end"
                  onClick={() => stergeProfesor(index)}
                >
                  Șterge
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Butoane finale */}
      <div className="mt-4 d-flex justify-content-between">
        <button className="btn btn-outline-primary" onClick={fetchProfesori}>
          🔄 Reîncarcă profesori
        </button>

        <button className="btn btn-primary" onClick={handleNext}>
          ➡ Continuă la generare orar
        </button>
      </div>
    </div>
  );
};

export default Profesori;
