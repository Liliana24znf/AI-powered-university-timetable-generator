import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Profesori = () => {
  const [lista, setLista] = useState([{ nume: "", discipline: [""], tip: "Curs" }]);
  const navigate = useNavigate();

  const handleChange = (index, field, value) => {
    const update = [...lista];
    update[index][field] = value;
    setLista(update);
  };

  const handleDisciplinaChange = (profIndex, discIndex, value) => {
    const update = [...lista];
    update[profIndex].discipline[discIndex] = value;
    setLista(update);
  };

  const adaugaDisciplina = (index) => {
    const update = [...lista];
    update[index].discipline.push("");
    setLista(update);
  };

  const adaugaProfesor = () => {
    setLista([...lista, { nume: "", discipline: [""], tip: "Curs" }]);
  };

  const stergeProfesor = (index) => {
    const update = [...lista];
    update.splice(index, 1);
    setLista(update);
  };

  const handleNext = () => {
    navigate("/orar-generat", { state: { profesori: lista } });
  };

  return (
    <div className="container mt-4">
      <h3>📘 Formular Profesori</h3>
      {lista.map((prof, i) => (
        <div key={i} className="card mb-3 p-3">
          <div className="mb-2">
            <label className="form-label">Nume profesor:</label>
            <input
              className="form-control"
              value={prof.nume}
              onChange={(e) => handleChange(i, "nume", e.target.value)}
              placeholder="Ex: Popescu Andrei"
            />
          </div>

          <div className="mb-2">
            <label className="form-label">Tip activitate:</label>
            <select
              className="form-select"
              value={prof.tip}
              onChange={(e) => handleChange(i, "tip", e.target.value)}
            >
              <option>Curs</option>
              <option>Seminar</option>
              <option>Laborator</option>
            </select>
          </div>

          <div className="mb-2">
            <label className="form-label">Discipline:</label>
            {prof.discipline.map((disc, j) => (
              <input
                key={j}
                className="form-control mb-1"
                value={disc}
                onChange={(e) => handleDisciplinaChange(i, j, e.target.value)}
                placeholder={`Disciplină #${j + 1}`}
              />
            ))}
            <button
              className="btn btn-sm btn-outline-secondary mt-2"
              onClick={() => adaugaDisciplina(i)}
            >
              + Adaugă disciplină
            </button>
          </div>

          <button className="btn btn-danger mt-2" onClick={() => stergeProfesor(i)}>
            Șterge profesor
          </button>
        </div>
      ))}

      <div className="mt-4">
        <button className="btn btn-primary me-2" onClick={adaugaProfesor}>
          + Adaugă profesor
        </button>
        <button className="btn btn-success" onClick={handleNext}>
          Continuă la generare orar
        </button>
      </div>
    </div>
  );
};

export default Profesori;
