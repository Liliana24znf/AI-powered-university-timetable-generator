import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const TimetableUniversityStep = () => {
  const [universityName, setUniversityName] = useState("Universitatea Galați");
  const [hasMultipleBuildings, setHasMultipleBuildings] = useState(false);
  const [days, setDays] = useState({ L: true, Ma: true, Mi: true, J: true, V: true, S: true, D: true });
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const toggleDay = (day) => {
    setDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const [schedule, setSchedule] = useState({
    L: [true, true, true, false, false, false],
    Ma: [true, true, true, false, false, false],
    Mi: [true, true, true, false, false, false],
    J: [true, true, true, false, false, false],
    V: [true, true, true, false, false, false],
    S: [false, false, false, false, false, false],
    D: [false, false, false, false, false, false],
  });

  const validateSchedule = () => {
    return Object.keys(days).some(day => days[day] && schedule[day].some(interval => interval));
  };

  const handleNext = () => {
    if (!validateSchedule()) {
      setError("Trebuie să existe cel puțin două perioade active pentru a genera orare.");
      return;
    }
    setError("");
    navigate("/timetable/grupe");
  };

  const timeIntervals = [
    "08:00-10:00", "10:00-12:00", "12:00-14:00",
    "14:00-16:00", "16:00-18:00", "18:00-20:00"
  ];

  return (
    <div className="container py-4">
      {/* Stepper */}
      <div className="d-flex justify-content-around mb-4">
        {["Universitatea mea", "Grupe", "Grupări", "Activități", "Profesori", "Cursuri", "Reguli orar"].map((label, index) => {
          const isActive = index === 0;
          return (
            <div key={index} className="d-flex flex-column align-items-center position-relative px-2">
              {index !== 0 && (
                <div className="position-absolute" style={{ top: "14px", left: "-28px", width: "28px", height: "2px", backgroundColor: "#ccc", zIndex: 0 }} />
              )}
              <div className="rounded-circle d-flex align-items-center justify-content-center mb-1"
                   style={{ width: "30px", height: "30px", backgroundColor: isActive ? "#0d6efd" : "#dee2e6", color: isActive ? "white" : "#6c757d", fontWeight: "bold" }}>
                {index + 1}
              </div>
              <small className={isActive ? "text-primary fw-semibold" : "text-muted"}>{label}</small>
            </div>
          );
        })}
      </div>

      {/* Info box - stil grupari */}
      <div className="alert alert-primary">
        <h6 className="fw-bold">ℹ️ Informații utile</h6>
        <ul className="mb-0">
          <li><strong>Numele universității</strong> va apărea pe orarele generate și pe fișierele exportate.</li>
          <li><strong>Clădiri:</strong> Dacă universitatea are mai multe corpuri, adaugă-le pentru alocare corectă a sălilor.</li>
          <li><strong>Perioade:</strong> Fiecare zi trebuie să aibă cel puțin două intervale active pentru a putea genera orarul.</li>
        </ul>
      </div>

      {/* Card principal */}
      <div className="card p-4 shadow-sm">
        <h5 className="fw-bold mb-3">Numele universității</h5>
        <input
          type="text"
          className="form-control mb-4"
          value={universityName}
          onChange={(e) => setUniversityName(e.target.value)}
        />

        {/* Clădiri */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <label className="fw-semibold mb-0">Universitatea are mai multe clădiri?</label>
          <div className="btn-group">
            <button className={`btn ${!hasMultipleBuildings ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setHasMultipleBuildings(false)}>Nu</button>
            <button className={`btn ${hasMultipleBuildings ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setHasMultipleBuildings(true)}>Da</button>
          </div>
        </div>

        <h6 className="fw-bold mb-3">Configurație intervale orare</h6>

        {/* Warning */}
        {error && <div className="alert alert-warning">{error}</div>}

        {/* Tabel intervale */}
        <table className="table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              <th>Ziua</th>
              {timeIntervals.map((interval) => (
                <th key={interval}>{interval}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(days).filter((zi) => days[zi]).map((zi) => (
              <tr key={zi}>
                <td className="fw-semibold">{zi}</td>
                {schedule[zi].map((value, i) => (
                  <td key={i}>
                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`${zi}-${i}`}
                        checked={value}
                        onChange={() => {
                          const updated = { ...schedule };
                          updated[zi][i] = !updated[zi][i];
                          setSchedule(updated);
                        }}
                      />
                      <label className="form-check-label small" htmlFor={`${zi}-${i}`}>
                        {value ? "Activ" : "Pauză"}
                      </label>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Navigare */}
        <div className="d-flex justify-content-end gap-3">
          <button className="btn btn-outline-secondary" disabled>← Pasul anterior</button>
          <button className="btn btn-primary" onClick={handleNext}>Pasul următor →</button>
        </div>
      </div>
    </div>
  );
};

export default TimetableUniversityStep;
