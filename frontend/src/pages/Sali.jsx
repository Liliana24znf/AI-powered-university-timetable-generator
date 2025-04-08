import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const Sali = () => {
  const [numarCursuri, setNumarCursuri] = useState(0);
  const [numarLabSem, setNumarLabSem] = useState(0);
  const [saliGenerat, setSaliGenerat] = useState([]);
  const navigate = useNavigate();

  const genereazaSali = async () => {
    const sali = [];
    for (let i = 1; i <= numarCursuri; i++) {
      sali.push({ cod: `GC${i}`, tip: "Curs" });
    }
    for (let i = 1; i <= numarLabSem; i++) {
      sali.push({ cod: `GA${i}`, tip: "Laborator/Seminar" });
    }

    setSaliGenerat(sali);

    try {
      const response = await fetch("http://localhost:5000/adauga_sali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sali),
      });

      const result = await response.json();
      alert(result.success ? "✅ Sălile au fost salvate!" : "❌ " + result.error);
      fetchSali();
    } catch (error) {
      alert("❌ Conexiune eșuată cu backend-ul.");
      console.error(error);
    }
  };

  const stergeToateSali = async () => {
    if (!window.confirm("Ești sigur că vrei să ștergi toate sălile?")) return;

    try {
      const response = await fetch("http://localhost:5000/sterge_sali", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        alert("🗑️ Toate sălile au fost șterse.");
        setSaliGenerat([]);
        fetchSali();
      } else {
        alert("❌ Eroare la ștergere: " + data.error);
      }
    } catch (error) {
      alert("❌ Eroare de rețea.");
      console.error(error);
    }
  };

  const fetchSali = async () => {
    try {
      const response = await fetch("http://localhost:5000/toate_sali");
      const data = await response.json();
      if (Array.isArray(data)) {
        setSaliGenerat(data);
      }
    } catch (err) {
      console.error("Eroare la încărcare săli:", err);
    }
  };

  useEffect(() => {
    fetchSali();
  }, []);

  return (
    <div style={{ minHeight: "100vh", width: "200%", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 w-100">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <Link to="/" className="navbar-brand fw-bold fs-4 text-primary">Generator Orare</Link>
          <div>
            <button className="btn btn-outline-primary me-2" onClick={fetchSali}>🔄 Reîncarcă</button>
            <button className="btn btn-secondary" onClick={() => navigate("/profesori")}>👨‍🏫 Mergi la Profesori</button>
          </div>
        </div>
      </nav>

      {/* Conținut */}
      <div className="container-fluid py-5"><div className="row justify-content-center gap-3">

          {/* Formular */}
          <div className="col-lg-4">
            <div className="card p-4 shadow-sm">
              <h4 className="mb-4">🏫 Introducere săli disponibile</h4>

              <div className="mb-3">
                <label className="form-label">Număr săli curs (GC):</label>
                <input type="number" className="form-control" value={numarCursuri} onChange={(e) => setNumarCursuri(parseInt(e.target.value) || 0)} />
              </div>

              <div className="mb-3">
                <label className="form-label">Număr săli laborator/seminar (GA):</label>
                <input type="number" className="form-control" value={numarLabSem} onChange={(e) => setNumarLabSem(parseInt(e.target.value) || 0)} />
              </div>

              <div className="d-flex gap-2 flex-wrap mt-3">
                <button className="btn btn-success" onClick={genereazaSali}>✅ Salvează</button>
                <button className="btn btn-danger" onClick={stergeToateSali}>🗑️ Șterge toate</button>
              </div>
            </div>
          </div>

          {/* Spațiu */}
          <div className="col-lg-1 d-none d-lg-block" />

          {/* Lista */}
          <div className="col-lg-6">
            <div className="card p-4 shadow-sm h-100">
              <h5 className="mb-3">📋 Săli disponibile:</h5>
              {saliGenerat.length === 0 ? (
                <p className="text-muted">Nicio sală disponibilă.</p>
              ) : (
                <ul className="list-group">
  {saliGenerat.map((s, i) => (
    <li
      key={i}
      className="list-group-item d-flex justify-content-between align-items-center"
    >
      <strong>{s.cod}</strong>

      <span
        className={`badge ${
          s.tip === "Curs" ? "bg-primary" : "bg-success"
        }`}
      >
        {s.tip}
      </span>
    </li>
  ))}
</ul>

              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white text-center text-muted py-3 border-top mt-auto">
        <p className="mb-0">© {new Date().getFullYear()} Generator Orare • Toate drepturile rezervate.</p>
      </footer>
    </div>
  );
};

export default Sali;
