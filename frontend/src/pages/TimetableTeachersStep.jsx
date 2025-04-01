import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const TimetableTeachersStep = () => {
  const [teachers, setTeachers] = useState([{ name: "Popescu Ana", email: "" }]);
  const navigate = useNavigate();

  const handleTeacherChange = (index, field, value) => {
    const updated = [...teachers];
    updated[index][field] = value;
    setTeachers(updated);
  };
  
  const addTeacher = () => {
    setTeachers([...teachers, { name: "", email: "" }]);
  };

  const removeTeacher = (index) => {
    const updated = [...teachers];
    updated.splice(index, 1);
    setTeachers(updated);
  };

  const handleNext = () => {
    navigate("/timetable/cursuri");
  };

  const handleBack = () => {
    navigate("/timetable/activitati");
  };

  return (
    <div className="container py-4">
      {/* Stepper vizual */}
      <div className="d-flex justify-content-around mb-4">
        {["Universitatea mea", "Grupe", "Grupări", "Activități", "Profesori", "Cursuri", "Reguli orar"].map((label, index) => {
          const isActive = index === 4;
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

      {/* Informativ + formular într-o singură coloană */}
      <div className="alert alert-warning">
        <strong>Atenție:</strong> Trebuie să aveți cel puțin doi profesori pentru a putea genera un orar.
      </div>

      <div className="alert alert-info">
        <strong>Gestionați profesorii</strong><br />
        Puteți adăuga un profesor folosind <em>Profesor nou</em> sau <em>Adăugare rapidă</em>.<br />
        Editează sau șterge direct din tabel folosind butoanele <i className="bi bi-pencil"></i> | <i className="bi bi-trash"></i>.
      </div>

      <div className="alert alert-primary">
        <strong>Configurare preferințe profesori</strong><br />
        În pagina de editare puteți seta:<br />
        • câte cursuri/zi <br />
        • câte zile/săptămână <br />
        • intervale indisponibile pentru cursuri.
      </div>

      <div className="alert alert-warning">
        <strong>Ștergere profesor:</strong><br />
        Ștergerea unui profesor implică și ștergerea tuturor cursurilor asociate lui.
      </div>

      <div className="alert alert-light border">
        <strong>Căutați un profesor:</strong><br />
        Căutați rapid după numele profesorului folosind filtrul <em>Nume profesor</em>.
      </div>

      <div className="card p-4 shadow-sm mt-4">
        <h5 className="fw-bold mb-3">Introduceți profesorii</h5>

        {teachers.map((teacher, index) => (
          <div key={index} className="row align-items-end mb-3">
            <div className="col-md-5">
              <label className="form-label">Nume profesor</label>
              <input
                type="text"
                className="form-control"
                value={teacher.name}
                onChange={(e) => handleTeacherChange(index, "name", e.target.value)}
              />
            </div>
            <div className="col-md-5">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={teacher.email}
                onChange={(e) => handleTeacherChange(index, "email", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button className="btn btn-danger w-100" onClick={() => removeTeacher(index)}>
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>
        ))}

        <div className="text-end mb-3">
          <button className="btn btn-outline-primary" onClick={addTeacher}>
            + Adaugă profesor
          </button>
        </div>

        <div className="d-flex justify-content-between mt-4">
          <button className="btn btn-outline-secondary" onClick={handleBack}>Pasul anterior</button>
          <button className="btn btn-primary" onClick={handleNext}>Pasul următor</button>
        </div>
      </div>
    </div>
  );
};

export default TimetableTeachersStep;
