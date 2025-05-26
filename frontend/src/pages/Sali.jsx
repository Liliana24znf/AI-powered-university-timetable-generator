import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";

const Sali = () => {
  const [numarCursuri, setNumarCursuri] = useState(0);
  const [numarLabSem, setNumarLabSem] = useState(0);
  const [saliGenerat, setSaliGenerat] = useState([]);
  const [saliSelectate, setSaliSelectate] = useState([]);
  const navigate = useNavigate();

  const genereazaSali = async () => {
    try {
      const response = await fetch("http://localhost:5000/toate_sali");
      const existente = await response.json();

      const maxGC = existente
        .filter((s) => s.tip === "Curs" && s.cod.startsWith("GC"))
        .map((s) => parseInt(s.cod.replace("GC", "")))
        .reduce((a, b) => Math.max(a, b), 0);

      const maxGA = existente
        .filter((s) => s.tip === "Laborator/Seminar" && s.cod.startsWith("GA"))
        .map((s) => parseInt(s.cod.replace("GA", "")))
        .reduce((a, b) => Math.max(a, b), 0);

      const sali = [];
      for (let i = 1; i <= numarCursuri; i++) sali.push({ cod: `GC${maxGC + i}`, tip: "Curs" });
      for (let i = 1; i <= numarLabSem; i++) sali.push({ cod: `GA${maxGA + i}`, tip: "Laborator/Seminar" });

      setSaliGenerat([...existente, ...sali]);

      const saveResponse = await fetch("http://localhost:5000/adauga_sali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sali),
      });

      const result = await saveResponse.json();
      if (result.success) {
        toast.success("✅ Sălile au fost salvate!");
        fetchSali();
      } else toast.error("❌ " + result.error);
    } catch (error) {
      toast.error("❌ Eroare la generare/trimite săli.");
      console.error(error);
    }
  };

  const fetchSali = async () => {
    try {
      const response = await fetch("http://localhost:5000/toate_sali");
      const data = await response.json();
      if (Array.isArray(data)) setSaliGenerat(data);
    } catch (err) {
      console.error("Eroare la încărcare săli:", err);
    }
  };

  const handleReincarcareClick = async () => {
  try {
    await fetchSali();
    toast.info("🔄 Lista sălilor a fost reîncărcată cu succes!");
  } catch {
    toast.error("❌ Eroare la reîncărcare săli.");
  }
};


  const toggleSelectSala = (cod) => {
    setSaliSelectate((prev) =>
      prev.includes(cod) ? prev.filter((s) => s !== cod) : [...prev, cod]
    );
  };

  const toggleSelectAllByTip = (tip, checked) => {
    const coduri = saliGenerat.filter((s) => s.tip === tip).map((s) => s.cod);
    setSaliSelectate((prev) =>
      checked ? Array.from(new Set([...prev, ...coduri])) : prev.filter((cod) => !coduri.includes(cod))
    );
  };

  const stergeSelectie = async () => {
    if (saliSelectate.length === 0) return toast.info("Selectează cel puțin o sală.");

    const confirm = await Swal.fire({
      title: "Ești sigur?",
      text: "Această acțiune va șterge sălile selectate.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Da, șterge!",
      cancelButtonText: "Anulează",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch("http://localhost:5000/sterge_sali_selectate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coduri: saliSelectate }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("✅ Sălile au fost șterse.");
        setSaliSelectate([]);
        fetchSali();
      } else toast.error("❌ " + result.error);
    } catch (error) {
      toast.error("❌ Eroare la conexiune.");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSali();
  }, []);

  return (
    <div className="container-fluid pt-4 px-4">
      <ToastContainer />
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 mb-4">
        <div className="container-fluid position-relative d-flex justify-content-center align-items-center">
          
          {/* Buton stânga: Logo sau link acasă */}
          <Link to="/" className="position-absolute start-0 text-primary fw-bold fs-4 text-decoration-none">
            Generator Orare
          </Link>
      
          {/* Titlu centrat */}
          <span className="text-primary fw-bold fs-4">
            🏫 Gestionare Săli
          </span>
      
          {/* Butoane în dreapta */}
          <div className="position-absolute end-0">
            <button className="btn btn-outline-primary me-2" onClick={handleReincarcareClick}>
              🔄 Reîncarcă
            </button>
            <button className="btn btn-primary" onClick={() => navigate("/profesori")}>
              ➡ Continuă
            </button>
          </div>
        </div>
      </nav>

<div className="container mb-4">
  <div className="card shadow-sm border-0 bg-light">
    <div className="card-body">
      <p className="mb-2">
        În această secțiune, poți introduce <strong>numărul de săli disponibile </strong> pentru cursuri și laboratoare/seminarii.
      </p>
      <p className="mb-2">
        Asigură-te că toate sălile sunt corect configurate înainte de generarea orarului.
      </p>
      <p className="mb-2">
        După ce ai introdus numărul de săli, apasă pe butonul <strong>"Salvează"</strong> pentru a le adăuga în sistem.
      </p>
      <p className="mb-2">
        Poți <strong> reîncărca </strong> lista de săli oricând pentru a vedea ultimele modificări.
      </p>
    </div>
  </div>
</div>

      


      <div className="my-4" />
      {/* Conținut */}
      <div className="row justify-content-center">
        {/* Formular */}
        <div className="col-sm-12 col-md-4 col-lg-3 mb-4">
          <div className="card p-4 shadow-sm h-100">
            <h4 className="mb-4">🏫 Introducere săli disponibile</h4>
            <div className="mb-3">
              <label className="form-label">Număr săli curs (GC):</label>
              <input
                type="number"
                className="form-control"
                value={numarCursuri}
                min="0"
                onFocus={(e) => e.target.value === "0" && (e.target.value = "")}
                onBlur={(e) => e.target.value === "" ? setNumarCursuri(0) : setNumarCursuri(parseInt(e.target.value))}
                onChange={(e) => setNumarCursuri(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Număr săli laborator/seminar (GA):</label>
              <input
                type="number"
                className="form-control"
                value={numarLabSem}
                min="0"
                onFocus={(e) => e.target.value === "0" && (e.target.value = "")}
                onBlur={(e) => e.target.value === "" ? setNumarLabSem(0) : setNumarLabSem(parseInt(e.target.value))}
                onChange={(e) => setNumarLabSem(parseInt(e.target.value) || 0)}
              />
            </div>
            <button className="btn btn-success mt-2 w-100" onClick={genereazaSali}>
              ✅ Salvează
            </button>
          </div>
        </div>

        {/* Curs */}
        <div className="col-sm-12 col-md-4 col-lg-4 mb-4">
          <div className="card p-4 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-primary mb-0">📘 Săli de Curs (GC)</h6>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="selectAllGC"
                  checked={saliGenerat.filter((s) => s.tip === "Curs").every((s) => saliSelectate.includes(s.cod))}
                  onChange={(e) => toggleSelectAllByTip("Curs", e.target.checked)}
                />
                <label className="form-check-label ms-1" htmlFor="selectAllGC">
                  Selectează toate
                </label>
              </div>
            </div>
            <ul className="list-group">
              {saliGenerat
                .filter((s) => s.tip === "Curs")
                .map((s, i) => (
                  <li key={`GC-${i}`} className="list-group-item d-flex align-items-center">
                    <input
                      className="form-check-input me-2"
                      type="checkbox"
                      checked={saliSelectate.includes(s.cod)}
                      onChange={() => toggleSelectSala(s.cod)}
                      id={`check-${s.cod}`}
                    />
                    <label className="form-check-label" htmlFor={`check-${s.cod}`}>
                      <strong>{s.cod}</strong>
                    </label>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Lab/Seminar */}
        <div className="col-sm-12 col-md-4 col-lg-5 mb-4">
          <div className="card p-4 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-success mb-0">🧪 Săli de Lab/Seminar (GA)</h6>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="selectAllGA"
                  checked={saliGenerat
                    .filter((s) => s.tip === "Laborator/Seminar")
                    .every((s) => saliSelectate.includes(s.cod))}
                  onChange={(e) => toggleSelectAllByTip("Laborator/Seminar", e.target.checked)}
                />
                <label className="form-check-label ms-1" htmlFor="selectAllGA">
                  Selectează toate
                </label>
              </div>
            </div>
            <ul className="list-group">
              {saliGenerat
                .filter((s) => s.tip === "Laborator/Seminar")
                .map((s, i) => (
                  <li key={`GA-${i}`} className="list-group-item d-flex align-items-center">
                    <input
                      className="form-check-input me-2"
                      type="checkbox"
                      checked={saliSelectate.includes(s.cod)}
                      onChange={() => toggleSelectSala(s.cod)}
                      id={`check-${s.cod}`}
                    />
                    <label className="form-check-label" htmlFor={`check-${s.cod}`}>
                      <strong>{s.cod}</strong>
                    </label>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Buton ștergere selecție */}
      {saliGenerat.length > 0 && (
        <div className="text-end mt-3">
          <button
            className="btn btn-danger"
            onClick={stergeSelectie}
            disabled={saliSelectate.length === 0}
          >
            🗑️ Șterge selecția
          </button>
        </div>
      )}
      {/* Footer */}
      <footer className="bg-light text-center py-4 mt-auto">
        <p className="mb-0">© 2023 Generator Orare. Toate drepturile rezervate.</p>
      </footer>
    </div>
  );
};

export default Sali;