import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";

const Grupe = () => {
const navigate = useNavigate();
const [nivel, setNivel] = useState("Licenta");
const [an, setAn] = useState("I");
const [nrGrupe, setNrGrupe] = useState(1);
const [nrSubgrupe, setNrSubgrupe] = useState(1);
const [grupeGenerat, setGrupeGenerat] = useState([]);
const [grupeSelectate, setGrupeSelectate] = useState([]);

const fetchGrupe = async () => {
try {
const response = await fetch("http://localhost:5000/toate_grupe");
const data = await response.json();
if (Array.isArray(data)) setGrupeGenerat(data);
} catch (err) {
console.error("Eroare la încărcare grupe:", err);
}
};

useEffect(() => {
fetchGrupe();
}, []);

const genereazaGrupe = async () => {
const noiGrupe = [];
for (let g = 1; g <= nrGrupe; g++) {
  for (let s = 0; s < nrSubgrupe; s++) {
    const subgrupa = String.fromCharCode(97 + s); // 'a', 'b', ...
    const denumire = `${an}${g}${subgrupa}`;
    noiGrupe.push({
      nivel,
      an,
      grupa: g.toString(),
      subgrupa,
      denumire,
    });
  }
}
try {
  const response = await fetch("http://localhost:5000/adauga_grupe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(noiGrupe),
  });
  const result = await response.json();
  if (result.success) {
    toast.success("✅ Grupele au fost salvate!");
    fetchGrupe();
  } else toast.error("❌ " + result.error);
} catch (err) {
  toast.error("❌ Eroare la salvare grupe.");
}
};

const toggleSelect = (cod) => {
setGrupeSelectate((prev) =>
prev.includes(cod) ? prev.filter((c) => c !== cod) : [...prev, cod]
);
};

const stergeSelectie = async () => {
if (grupeSelectate.length === 0) return toast.info("Selectează cel puțin o grupă.");
const confirm = await Swal.fire({
title: "Ești sigur?",
text: "Grupele selectate vor fi șterse.",
icon: "warning",
showCancelButton: true,
confirmButtonText: "Da, șterge!",
cancelButtonText: "Anulează",
});
if (!confirm.isConfirmed) return;

try {
  const response = await fetch("http://localhost:5000/sterge_grupe_selectate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coduri: grupeSelectate }),
  });
  const result = await response.json();
  if (result.success) {
    toast.success("✅ Grupele au fost șterse.");
    setGrupeSelectate([]);
    fetchGrupe();
  } else toast.error("❌ " + result.error);
} catch (err) {
  toast.error("❌ Eroare la conexiune.");
}
};

return (
<div className="container-fluid pt-4 px-4">
<ToastContainer />
<nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 mb-4">
<div className="container-fluid position-relative d-flex justify-content-center align-items-center">
<Link to="/" className="position-absolute start-0 text-primary fw-bold fs-4 text-decoration-none">
Generator Orare
</Link>
<span className="text-primary fw-bold fs-4">👥 Gestionare Grupe</span>
<div className="position-absolute end-0">
<button className="btn btn-outline-primary me-2" onClick={fetchGrupe}>
🔄 Reîncarcă
</button>
<button className="btn btn-primary" onClick={() => navigate("/sali")}>
➡ Continuă
</button>
</div>
</div>
</nav>
  <div className="row justify-content-center">
    <div className="col-md-4 mb-4">
      <div className="card p-4 shadow-sm">
        <h4 className="mb-3">⚙️ Setare manuală Grupe</h4>
        <div className="mb-3">
          <label className="form-label">Nivel:</label>
          <select className="form-select" value={nivel} onChange={(e) => setNivel(e.target.value)}>
            <option value="Licenta">Licență</option>
            <option value="Master">Master</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">An:</label>
          <select className="form-select" value={an} onChange={(e) => setAn(e.target.value)}>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Număr Grupe:</label>
          <input
            type="number"
            min="1"
            className="form-control"
            value={nrGrupe}
            onChange={(e) => setNrGrupe(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Număr Subgrupe / grupă:</label>
          <input
            type="number"
            min="1"
            className="form-control"
            value={nrSubgrupe}
            onChange={(e) => setNrSubgrupe(parseInt(e.target.value) || 1)}
          />
        </div>
        <button className="btn btn-success w-100" onClick={genereazaGrupe}>
          ✅ Generează Grupe
        </button>
      </div>
    </div>

    <div className="col-md-7 mb-4">
      <div className="card p-4 shadow-sm">
        <h5 className="mb-3">📋 Grupe existente:</h5>
        {grupeGenerat.length === 0 ? (
          <p className="text-muted">Nu există grupe adăugate încă.</p>
        ) : (
          <ul className="list-group">
            {grupeGenerat.map((gr, i) => (
              <li key={i} className="list-group-item d-flex align-items-center">
                <input
                  type="checkbox"
                  className="form-check-input me-2"
                  checked={grupeSelectate.includes(gr.denumire)}
                  onChange={() => toggleSelect(gr.denumire)}
                />
<div className="d-flex flex-column">
  <span className="fw-bold text-dark">
    🧑‍🎓 {gr.denumire}
  </span>
  <div className="small text-muted">
    <span className="badge bg-primary me-1">{gr.nivel}</span>
    <span className="badge bg-secondary me-1">An {gr.an}</span>
   
    <span className="badge bg-success">Grupa {gr.grupa}</span>
    {gr.subgrupa && <span className="badge bg-info">Subgrupa {gr.subgrupa}</span>}
    </div>
    </div>

              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>

  {grupeGenerat.length > 0 && (
    <div className="text-end mt-3">
      <button className="btn btn-danger" onClick={stergeSelectie}>
        🗑️ Șterge selecția
      </button>
    </div>
  )}

  <footer className="bg-light text-center py-4 mt-auto">
    <p className="mb-0">© {new Date().getFullYear()} Generator Orare. Toate drepturile rezervate.</p>
  </footer>
</div>
);
};

export default Grupe;