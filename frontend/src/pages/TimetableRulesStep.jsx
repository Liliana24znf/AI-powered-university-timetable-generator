import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const TimetableRulesStep = () => {
  const [rules, setRules] = useState([
    { description: "Maxim 6 ore pe zi", enabled: true },
  ]);
  const navigate = useNavigate();

  const handleRuleChange = (index, field, value) => {
    const updated = [...rules];
    updated[index][field] = value;
    setRules(updated);
  };

  const addRule = () => {
    setRules([...rules, { description: "", enabled: true }]);
  };

  const removeRule = (index) => {
    const updated = [...rules];
    updated.splice(index, 1);
    setRules(updated);
  };

  const handleBack = () => {
    navigate("/timetable/cursuri");
  };

  const handleFinish = () => {
    alert("Reguli salvate! Urmează generarea orarului.");
  };

  return (
    <div className="container py-4">

      {/* Stepper vizual */}
      <div className="d-flex justify-content-around mb-4">
        {["Universitatea mea", "Grupe", "Grupări", "Activități", "Profesori", "Cursuri", "Reguli orar"].map((label, index) => {
          const isActive = index === 6;
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

      {/* Layout cu două coloane */}
      <div className="row">
        {/* Informații (stânga) */}
        <div className="col-md-5 pe-4">
          <div className="alert alert-warning">
            <strong>Atenție:</strong> La generarea orarului se aplică doar regulile active.
          </div>

          <div className="alert alert-info">
            <strong>Configurați regulile</strong><br />
            Cu cât o regulă este mai <strong>importantă</strong>, cu atât este mai puțin probabil să fie încălcată.
          </div>

          <div className="alert alert-light border">
            <strong>Modificarea regulilor</strong><br />
            Apăsați butonul ✏️ pentru a edita o regulă sau 🗑️ pentru a o șterge.
          </div>
        </div>

        {/* Formularele (dreapta) */}
        <div className="col-md-7">
          <div className="card p-4 shadow-sm">
            <h5 className="fw-bold mb-3">Adăugați reguli pentru generarea orarului</h5>

            {rules.map((rule, index) => (
              <div key={index} className="row align-items-center mb-3">
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Minim 2 pauze pe zi"
                    value={rule.description}
                    onChange={(e) => handleRuleChange(index, "description", e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={rule.enabled}
                      onChange={(e) => handleRuleChange(index, "enabled", e.target.checked)}
                    />
                    <label className="form-check-label">Activă</label>
                  </div>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-danger w-100" onClick={() => removeRule(index)}>🗑️</button>
                </div>
              </div>
            ))}

            <div className="text-end mb-3">
              <button className="btn btn-outline-primary" onClick={addRule}>+ Adaugă regulă</button>
            </div>

            <div className="d-flex justify-content-between">
              <button className="btn btn-outline-secondary" onClick={handleBack}>Pasul anterior</button>
              <button className="btn btn-success" onClick={handleFinish}>Finalizează</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableRulesStep;
