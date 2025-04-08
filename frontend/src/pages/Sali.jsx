import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // 👈 import necesar

const Sali = () => {
  const [numarCursuri, setNumarCursuri] = useState(0);
  const [numarLabSem, setNumarLabSem] = useState(0);
  const [saliGenerat, setSaliGenerat] = useState([]);
  const navigate = useNavigate(); // 👈 definirea funcției de navigare

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sali),
      });

      const result = await response.json();
      if (!result.success) {
        alert("Eroare la salvare: " + result.error);
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
      } else {
        alert("Eroare la ștergere: " + data.error);
      }
    } catch (error) {
      alert("Eroare de rețea la ștergerea sălilor.");
      console.error(error);
    }
  };

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

      <button className="btn btn-success" onClick={genereazaSali}>
        ✅ Salvează în baza de date
      </button>

      <button className="btn btn-danger mt-3 ms-2" onClick={stergeToateSali}>
        🗑️ Șterge toate sălile
      </button>

      <button className="btn btn-primary mt-3 ms-2" onClick={() => navigate("/profesori")}>
        👨‍🏫 Mergi la Profesori
      </button>

      {saliGenerat.length > 0 && (
        <div className="mt-4">
          <h5>📋 Săli generate:</h5>
          <ul className="list-group">
            {saliGenerat.map((s, i) => (
              <li key={i} className="list-group-item">
                {s.cod} – {s.tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sali;
