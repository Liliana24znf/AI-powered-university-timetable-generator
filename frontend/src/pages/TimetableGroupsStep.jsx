import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const TimetableGroupsStep = () => {
  const [groups, setGroups] = useState([{ name: "Grupa 1", students: 30 }]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleGroupChange = (index, field, value) => {
    const updatedGroups = [...groups];
    updatedGroups[index][field] = value;
    setGroups(updatedGroups);
  };

  const addGroup = () => {
    setGroups([...groups, { name: "", students: 0 }]);
  };

  const removeGroup = (index) => {
    const updatedGroups = [...groups];
    updatedGroups.splice(index, 1);
    setGroups(updatedGroups);
  };

  const handleBack = () => {
    navigate("/timetable/universitate");
  };

  const handleNext = () => {
    navigate("/timetable/grupari");
  };

  return (
    <div className="container py-4">
      {/* Stepper */}
      <div className="d-flex justify-content-around mb-4">
        {["Universitatea mea", "Grupe", "Grupări", "Activități", "Profesori", "Cursuri", "Reguli orar"].map((label, index) => {
          const isActive = index === 1;
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

      {/* Info box */}
      <div className="alert alert-primary">
        <h6 className="fw-bold">📘 Ce este o grupare?</h6>
        <ul className="mb-0">
          <li>O grupare este o subdiviziune a unei grupe (ex: grupa X = subgrupa 1).</li>
          <li>Poți aloca cursuri pe grupări specifice.</li>
          <li>Nu este permis ca un student să fie în mai multe grupări pentru același curs.</li>
        </ul>
      </div>

      {/* Delete warning */}
      <div className="alert alert-warning">
        <strong>⚠️ Ștergere grupare:</strong> Dacă ștergi o grupare, se vor pierde toate cursurile asociate. Asigură-te că ai revizuit datele înainte!
      </div>

      {/* Grupări form */}
      <div className="card p-4 shadow-sm mb-4">
        <h5 className="fw-bold mb-3">Gestionați grupele</h5>

        {groups.map((group, index) => (
          <div key={index} className="row align-items-end mb-3">
            <div className="col-md-5">
              <label className="form-label">Nume grupă</label>
              <input type="text" className="form-control" value={group.name} onChange={(e) => handleGroupChange(index, "name", e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Număr studenți</label>
              <input type="number" className="form-control" value={group.students} onChange={(e) => handleGroupChange(index, "students", e.target.value)} />
            </div>
            <div className="col-md-3 d-grid">
              <button className="btn btn-danger mt-4" onClick={() => removeGroup(index)}>🗑️ Șterge</button>
            </div>
          </div>
        ))}

        <div className="text-end">
          <button className="btn btn-outline-primary" onClick={addGroup}>+ Adaugă grupă</button>
        </div>
      </div>

      {/* Search field */}
      <div className="mb-4">
        <label className="form-label fw-semibold">Caută o grupă anume</label>
        <input type="text" className="form-control" placeholder="Ex: Grupa 1..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* Navigare */}
      <div className="d-flex justify-content-between">
        <button className="btn btn-outline-secondary" onClick={handleBack}>← Pasul anterior</button>
        <button className="btn btn-primary" onClick={handleNext}>Pasul următor →</button>
      </div>
    </div>
  );
};

export default TimetableGroupsStep;
