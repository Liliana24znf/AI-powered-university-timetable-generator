import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const TimetableActivitiesStep = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([
    { name: "Curs Matematică", duration: 2 },
  ]);

  const handleActivityChange = (index, field, value) => {
    const updated = [...activities];
    updated[index][field] = value;
    setActivities(updated);
  };

  const addActivity = () => {
    setActivities([...activities, { name: "", duration: 1 }]);
  };

  const removeActivity = (index) => {
    const updated = [...activities];
    updated.splice(index, 1);
    setActivities(updated);
  };

  const handleNext = () => {
    navigate("/timetable/profesori");
  };

  return (
    <div className="container py-4">

   {/* Stepper vizual */}
   <div className="d-flex justify-content-around mb-4">
   {["Universitatea mea", "Grupe", "Grupări", "Activități", "Profesori", "Cursuri", "Reguli orar"].map((label, index) => {
    const isActive = index === 3; // ← pasul activ: Grupe
    return (
      <div key={index} className="d-flex flex-column align-items-center position-relative px-2">
        {index !== 0 && (
          <div
            className="position-absolute"
            style={{
              top: "14px",
              left: "-28px",
              width: "28px",
              height: "2px",
              backgroundColor: "#ccc",
              zIndex: 0,
            }}
          />
        )}
        <div
          className="rounded-circle d-flex align-items-center justify-content-center mb-1"
          style={{
            width: "30px",
            height: "30px",
            backgroundColor: isActive ? "#0d6efd" : "#dee2e6",
            color: isActive ? "white" : "#6c757d",
            fontWeight: "bold",
            zIndex: 1,
          }}
        >
          {index + 1}
        </div>
        <small className={isActive ? "text-primary fw-semibold" : "text-muted"}>
          {label}
        </small>
      </div>
    );
  })}
</div>
{/* Secțiuni informative */}  
<div className="mb-4">
  <div className="alert alert-warning">
    <strong>Atenție:</strong> Trebuie să aveți cel puțin două activități adăugate pentru a putea genera un orar.
  </div>

  <div className="alert alert-info">
    <strong>Gestionați activitățile</strong><br />
    Puteți adăuga o activitate folosind butoanele de <em>Activitate nouă</em> sau <em>Adăugare rapidă</em>.<br />
    Puteți edita sau șterge o activitate folosind butoanele din tabelul de activități.<br />
    <i className="bi bi-pencil"></i> Editare | <i className="bi bi-trash"></i> Ștergere
  </div>

  <div className="alert alert-warning">
    <strong>Ștergere activitate</strong><br />
    În cazul în care doriți să ștergeți o activitate, revizuiți cursurile acesteia (dacă există).
    Ștergerea unei activități implică și ștergerea tuturor cursurilor asociate.
  </div>

  <div className="alert alert-light border">
    <strong>Căutați o activitate</strong><br />
    Puteți găsi rapid o activitate căutând după numele acesteia. Folosiți câmpul de filtrare <em>Nume activitate</em>.
  </div>
</div>

      {/* Activity Form */}
      <div className="card p-4 shadow-sm">
        <h5 className="fw-bold mb-3">Introduceți activitățile</h5>

        {activities.map((activity, index) => (
          <div key={index} className="row align-items-end mb-3">
            <div className="col-md-8">
              <label className="form-label">Denumire activitate</label>
              <input
                type="text"
                className="form-control"
                value={activity.name}
                onChange={(e) => handleActivityChange(index, "name", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Durată (ore)</label>
              <input
                type="number"
                className="form-control"
                min="1"
                value={activity.duration}
                onChange={(e) => handleActivityChange(index, "duration", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button className="btn btn-danger w-100" onClick={() => removeActivity(index)}>Șterge</button>
            </div>
          </div>
        ))}

        <div className="text-end">
          <button className="btn btn-outline-primary" onClick={addActivity}>+ Adaugă activitate</button>
        </div>

        <div className="d-flex justify-content-between mt-4">
          <button className="btn btn-outline-secondary" onClick={() => navigate("/timetable/grupari")}>Pasul anterior</button>
          <button className="btn btn-primary" onClick={handleNext}>Pasul următor</button>
        </div>
      </div>
    </div>
  );
};

export default TimetableActivitiesStep;