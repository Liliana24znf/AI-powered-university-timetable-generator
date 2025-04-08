import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
      if (!result.success) {
        alert("Eroare la salvare: " + result.error);
      } else {
        alert("✅ Sălile au fost salvate!");
        fetchSali(); // actualizare listă
      }
    } catch (error) {
      alert("Conexiune eșuată cu backend-ul.");
      console.error(error);
    }
  };

  const stergeToateSali = async () => {
    if (!window.confirm("Ești sigur că vrei să ștergi toate sălile?")) return;

    try {
      const response = await fetch("http://localhost:5000/sterge_sali", {
        method: "POST",
      });

      const data = await response.json();
      if (data.success) {
        alert("Toate sălile au fost șterse.");
        setSaliGenerat([]);
        fetchSali(); // actualizare
      } else {
        alert("Eroare la ștergere: " + data.error);
      }
    } catch (error) {
      alert("Eroare de rețea la ștergerea sălilor.");
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
      console.error("Eroare la încărcarea sălilor:", err);
    }
  };

  useEffect(() => {
    fetchSali();
  }, []);

  return (
    <div className="container mt-4">
      <h3>🏫 Introducere săli disponibile</h3>

      <div className="mb-3">
        <label className="form-label">Număr săli curs (prefix GC):</label>
        <input
          type="number"
          className="form-control"
          value={numarCursuri}
          onChange={(e) => setNumarCursuri(parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Număr săli laborator/seminar (prefix GA):</label>
        <input
          type="number"
          className="form-control"
          value={numarLabSem}
          onChange={(e) => setNumarLabSem(parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="d-flex gap-2 mt-3 flex-wrap">
        <button className="btn btn-success" onClick={genereazaSali}>
          ✅ Salvează în baza de date
        </button>

        <button className="btn btn-danger" onClick={stergeToateSali}>
          🗑️ Șterge toate sălile
        </button>

        <button className="btn btn-outline-primary" onClick={fetchSali}>
          🔄 Reîncarcă sălile
        </button>

        <button className="btn btn-secondary" onClick={() => navigate("/profesori")}>
          👨‍🏫 Mergi la Profesori
        </button>
      </div>

      {saliGenerat.length > 0 && (
        <div className="mt-4">
          <h5>📋 Săli disponibile:</h5>
          <ul className="list-group">
            {saliGenerat.map((s, i) => (
              <li key={i} className="list-group-item">
                <strong>{s.cod}</strong> – {s.tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sali;
