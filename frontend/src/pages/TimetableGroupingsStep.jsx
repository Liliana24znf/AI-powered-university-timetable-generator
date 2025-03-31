import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const TimetableGroupingsStep = () => {
  const navigate = useNavigate();
  const [groupings, setGroupings] = useState([{ name: "Toată grupa" }]);

  const addGrouping = () => {
    setGroupings([...groupings, { name: "" }]);
  };

  const updateGrouping = (index, value) => {
    const updated = [...groupings];
    updated[index].name = value;
    setGroupings(updated);
  };

  const removeGrouping = (index) => {
    const updated = [...groupings];
    updated.splice(index, 1);
    setGroupings(updated);
  };

  return (
    <div className="container py-4">
      {/* Stepper */}
      <div className="d-flex justify-content-around mb-4">
        {["Universitatea mea", "Grupe", "Grupări", "Activități", "Profesori", "Cursuri", "Reguli orar"].map((label, index) => {
          const isActive = index === 2;
          return (
            <div key={index} className="d-flex flex-column align-items-center position-relative px-2">
              {index !== 0 && <div className="position-absolute" style={{ top: "14px", left: "-28px", width: "28px", height: "2px", backgroundColor: "#ccc", zIndex: 0 }} />}
              <div className="rounded-circle d-flex align-items-center justify-content-center mb-1"
                style={{
                  width: "30px",
                  height: "30px",
                  backgroundColor: isActive ? "#0d6efd" : "#dee2e6",
                  color: isActive ? "white" : "#6c757d",
                  fontWeight: "bold",
                  zIndex: 1,
                }}>
                {index + 1}
              </div>
              <small className={isActive ? "text-primary fw-semibold" : "text-muted"}>{label}</small>
            </div>
          );
        })}
      </div>

      {/* Explicații */}
      <div className="alert alert-primary">
        <h6><i className="bi bi-info-circle-fill me-2"></i>Ce este o grupare?</h6>
        <ul className="mb-0 ps-4">
          <li>O grupare este o subîmpărțire a unei grupe mari (ex: “Grupa 1” → “Grupa 1 - Subgrupa A”).</li>
          <li>Folosită pentru a gestiona cursuri diferite pentru subgrupe.</li>
          <li>Un student nu trebuie să aparțină la mai multe grupări în același timp.</li>
        </ul>
      </div>

      <div className="alert alert-warning">
        <strong>Atenție:</strong> Dacă ștergi o grupare, toate cursurile asociate acesteia vor fi eliminate.
      </div>

      {/* Form grupări */}
      <div className="card p-4 shadow-sm mb-4">
        <h5 className="fw-bold mb-3">Gestionați grupările</h5>
        {groupings.map((g, index) => (
          <div className="input-group mb-3" key={index}>
            <input
              type="text"
              className="form-control"
              placeholder="Nume grupare"
              value={g.name}
              onChange={(e) => updateGrouping(index, e.target.value)}
            />
            <button className="btn btn-danger" onClick={() => removeGrouping(index)}>
              <i className="bi bi-trash"></i>
            </button>
          </div>
        ))}
        <button className="btn btn-outline-primary" onClick={addGrouping}>
          + Adaugă grupare
        </button>
      </div>

      {/* Navigare */}
      <div className="d-flex justify-content-between">
        <button className="btn btn-outline-secondary" onClick={() => navigate("/timetable/grupe")}>
          Pasul anterior
        </button>
        <button className="btn btn-primary" onClick={() => navigate("/timetable/activitati")}>
          Pasul următor
        </button>
      </div>
    </div>
  );
};

export default TimetableGroupingsStep;
