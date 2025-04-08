import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

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
      alert("⚠️ Te rog completează toate câmpurile.");
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
        alert("✅ Profesor adăugat cu succes!");
        fetchProfesori();
        setFormular({ nume: "", discipline: [""], nivel: "Licenta", tipuri: [] });
      } else {
        alert("❌ Eroare la salvare: " + result.error);
      }
    } catch (error) {
      console.error("Eroare:", error);
      alert("❌ Nu s-a putut conecta la backend.");
    }
  };

  const stergeProfesor = (index) => {
    if (window.confirm("Ești sigur că vrei să ștergi acest profesor?")) {
      const actualizat = [...lista];
      actualizat.splice(index, 1);
      setLista(actualizat);
    }
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
    <div style={{ minHeight: "100vh", width: "170%", display: "flex", flexDirection: "column" }}>
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 w-100">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <Link to="/" className="navbar-brand text-primary fw-bold fs-4">Generator Orare</Link>
          <div>
            <button className="btn btn-outline-primary me-2" onClick={fetchProfesori}>🔄 Reîncarcă</button>
            <button className="btn btn-primary" onClick={handleNext}>➡ Continuă</button>
          </div>
        </div>
      </nav>

      {/* CONȚINUT */}
      <div className="container-fluid flex-grow-1 d-flex justify-content-between align-items-start p-4 gap-4">
        {/* Coloana 1: Formular */}
        <div className="bg-white p-4 shadow-sm rounded" style={{ width: "50%" }}>

          <h4 className="mb-3">🧾 Formular Profesor</h4>

          <div className="mb-2">
            <label className="form-label">Nume:</label>
            <input className="form-control" value={formular.nume} onChange={(e) => handleFormChange("nume", e.target.value)} />
          </div>

          <div className="mb-2">
            <label className="form-label">Nivel:</label>
            <select className="form-select" value={formular.nivel} onChange={(e) => handleFormChange("nivel", e.target.value)}>
              <option value="Licenta">Licență</option>
              <option value="Master">Master</option>
            </select>
          </div>

          <div className="mb-2">
            <label className="form-label">Tipuri activitate:</label>
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
              />
            ))}
            <button className="btn btn-sm btn-outline-secondary mt-2" onClick={adaugaDisciplina}>
              + Adaugă disciplină
            </button>
          </div>

          <div className="d-flex justify-content-between mt-3">
            <button className="btn btn-success" onClick={adaugaProfesor}>✅ Salvează profesor</button>
            <button className="btn btn-outline-secondary" onClick={() => setFormular({ nume: "", discipline: [""], nivel: "Licenta", tipuri: [] })}>🔄 Resetare</button>
          </div>
        </div>

        {/* Spațiu liber central */}
        <div style={{ width: "25%" }} />


        {/* Coloana 2: Lista Profesori */}
        <div className="bg-white p-4 shadow-sm rounded" style={{ width: "50%" }}>

          <h5 className="mb-3">📋 Profesori existenți:</h5>
          {lista.length === 0 && <p className="text-muted">Nu există profesori.</p>}
          <ul className="list-group">
            {lista.map((prof, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between flex-column">
                <div><strong>{prof.nume}</strong> – {prof.nivel}</div>
                <div className="mt-1">
                  {prof.tipuri.map((t, i) => <span key={i} className="badge bg-primary me-1">{t}</span>)}
                  {prof.discipline.map((d, i) => <span key={i} className="badge bg-secondary me-1">{d}</span>)}
                </div>
                <button className="btn btn-sm btn-danger mt-2 align-self-end" onClick={() => stergeProfesor(index)}>🗑️ Șterge</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white text-center text-muted py-3 border-top">
        <p className="mb-0">&copy; {new Date().getFullYear()} Generator Orare • Toate drepturile rezervate.</p>
      </footer>
    </div>
  );
};

export default Profesori;
