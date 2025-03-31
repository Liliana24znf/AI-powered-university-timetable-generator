import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const TimetableCoursesStep = () => {
  const [courses, setCourses] = useState([{ name: "Matematică", teacher: "" }]);
  const navigate = useNavigate();

  const handleCourseChange = (index, field, value) => {
    const updated = [...courses];
    updated[index][field] = value;
    setCourses(updated);
  };

  const addCourse = () => {
    setCourses([...courses, { name: "", teacher: "" }]);
  };

  const removeCourse = (index) => {
    const updated = [...courses];
    updated.splice(index, 1);
    setCourses(updated);
  };

  const handleNext = () => {
    navigate("/timetable/reguli");
  };

  const handleBack = () => {
    navigate("/timetable/profesori");
  };

  return (
    <div className="container py-4">
      {/* Stepper */}
      <div className="d-flex justify-content-around mb-4">
        {["Universitatea mea", "Grupe", "Grupări", "Activități", "Profesori", "Cursuri", "Reguli orar"].map((label, index) => {
          const isActive = index === 5;
          return (
            <div key={index} className="d-flex flex-column align-items-center position-relative px-2">
              {index !== 0 && (
                <div className="position-absolute" style={{
                  top: "14px", left: "-28px", width: "28px", height: "2px",
                  backgroundColor: "#ccc", zIndex: 0
                }} />
              )}
              <div className="rounded-circle d-flex align-items-center justify-content-center mb-1" style={{
                width: "30px", height: "30px", backgroundColor: isActive ? "#0d6efd" : "#dee2e6",
                color: isActive ? "white" : "#6c757d", fontWeight: "bold", zIndex: 1
              }}>
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
          <strong>Atenție:</strong> Trebuie să aveți cel puțin un curs definit pentru a putea continua.
        </div>

        <div className="alert alert-light border">
          <h6 className="fw-bold mb-1">Configurați cursurile</h6>
          Pentru fiecare profesor, adăugați cursurile și configurați-le în funcție de preferințe.
        </div>

        <div className="alert alert-secondary">
          <h6 className="fw-bold mb-1">Importați cursurile</h6>
          Dacă doriți să importați din Excel, folosiți opțiunea <em>Importați cursurile</em>.
        </div>

        <div className="alert alert-info">
          <h6 className="fw-bold mb-1">Gestionați cursurile</h6>
          Editați, adăugați sau ștergeți cursuri folosind formularul de mai jos.
        </div>

        <div className="alert alert-primary">
          <h6 className="fw-bold mb-1">Importanța cursului</h6>
          Nu uitați să setați <strong>importanța</strong> cursului – cursurile importante pot fi planificate mai devreme.
        </div>

        <div className="alert alert-light border">
          <h6 className="fw-bold mb-1">Căutați rapid</h6>
          Găsiți cursuri tastând după numele profesorului, activității sau grupei.
        </div>
      </div>

      {/* Formular cursuri */}
      <div className="card p-4 shadow-sm">
        <h5 className="fw-bold mb-3">Introduceți cursurile</h5>

        {courses.map((course, index) => (
          <div key={index} className="row align-items-end mb-3">
            <div className="col-md-6">
              <label className="form-label">Nume curs</label>
              <input
                type="text"
                className="form-control"
                value={course.name}
                onChange={(e) => handleCourseChange(index, "name", e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Profesor</label>
              <input
                type="text"
                className="form-control"
                value={course.teacher}
                onChange={(e) => handleCourseChange(index, "teacher", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button className="btn btn-danger w-100" onClick={() => removeCourse(index)}>
                Șterge
              </button>
            </div>
          </div>
        ))}

        <div className="text-end mb-3">
          <button className="btn btn-outline-primary" onClick={addCourse}>
            + Adaugă curs
          </button>
        </div>

        <div className="d-flex justify-content-between">
          <button className="btn btn-outline-secondary" onClick={handleBack}>Pasul anterior</button>
          <button className="btn btn-primary" onClick={handleNext}>Pasul următor</button>
        </div>
      </div>
    </div>
  );
};

export default TimetableCoursesStep;
