import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2"; // pentru prompt elegant
import { Link } from "react-router-dom";
import useGeneratedTimetable from "../functiiLogice/useGeneratedTimetable";



const GeneratedTimetable = () => {
  const {
    user,
    orar,
    nivelSelectat,
    anSelectat,
    raportValidare,
    loadingGPT,
    loadingClasic,
    orareFiltrate,
    aniDisponibili,
    regula_id,
    continutRegula,
    denumireRegulaSelectata,
    genereazaOrar,
    genereazaOrarClasic,
    exportExcel,
    exportPDF,
    handleLogout,
    incarcaOrarSalvat,
    stergeOrar,
    editeazaDenumire,
    setNivelSelectat,
    setAnSelectat,
    setCautareOrar,
    cautareOrar
  } = useGeneratedTimetable();
const renderOrar = () => {
  if (!orar) return null;

  const zileOrdine = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];

  const getBadgeClass = (tipActivitate) => {
    if (!tipActivitate) return "bg-secondary";
    if (tipActivitate.toLowerCase().includes("curs")) return "bg-info";
    if (tipActivitate.toLowerCase().includes("laborator")) return "bg-success";
    if (tipActivitate.toLowerCase().includes("seminar")) return "bg-warning";
    return "bg-secondary";
  };

  return (
    <div className="table-responsive" id="orar-afisat">
      {Object.entries(orar)
      .filter(([nivel]) => nivel === nivelSelectat)
      .map(([nivel, grupeOrar]) => (
        <div key={nivel}>
          <h2 className="text-primary fw-bold">{nivel}</h2>
          {Object.entries(grupeOrar).map(([denumireGrupa, zile]) => {
            const intervale = new Set();
            zileOrdine.forEach((zi) => {
              const ziData = zile[zi];
              if (ziData) {
                Object.keys(ziData).forEach((interval) => intervale.add(interval));
              }
            });

            const intervaleSortate = Array.from(intervale).sort();

            return (
              <div key={`${nivel}-${denumireGrupa}`} className="mb-4 page-break">
                <h4>📘 {nivel} – {denumireGrupa}</h4>
                <table className="table table-bordered text-center align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Interval</th>
                      {zileOrdine.map((zi) => (
                        <th key={zi}>{zi}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {intervaleSortate.map((interval) => (
                      <tr key={interval}>
                        <td><strong>{interval}</strong></td>
                        {zileOrdine.map((zi) => {
                          const activitate = zile[zi]?.[interval];
                          return (
                            <td key={`${zi}-${interval}`}>
                              {activitate ? (
                                typeof activitate === "object" ? (
                                  <>
                                    <span className={`badge ${getBadgeClass(activitate.tip)} mb-1`}>
                                      {activitate.activitate}
                                    </span>
                                    <div>{activitate.profesor}</div>
                                    <div className="text-muted">{activitate.sala}</div>
                                  </>
                                ) : (
                                  <span className="badge bg-secondary">{activitate}</span>
                                )
                              ) : (
                                "-"
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};


  return (
   <div className="container-fluid pt-4 px-4">
<nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 mb-4">
  <div className="container-fluid position-relative d-flex align-items-center justify-content-between">
<Link to="/" className="fs-6 fw-bold fs-6 m-0 d-flex flex-column align-items-start justify-content-center text-decoration-none">
  <span>Aplicație pentru planificare inteligentă</span>
  <span className="small">utilizând tehnici de A.I.</span>
</Link>

    {/* Centru: Titlu orar, poziționat absolut pentru centrare perfectă */}
    <div className="position-absolute top-50 start-50 translate-middle">
      <span className="text-primary fw-bold fs-4">📅 Orar Generat</span>
    </div>

    {/* Dropdown meniu utilizator */}
    <div className="dropdown">
      <button
        className="btn btn-outline-dark dropdown-toggle"
        type="button"
        id="dropdownMenuButton"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i className="bi bi-person-circle me-1"></i>
        {user?.nume || "Utilizator"}
      </button>
      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">
        <li>
          <span className="dropdown-item-text text-muted small">
            👋 Salut, <strong>{user?.nume || "Utilizator"}</strong>
          </span>
        </li>
        <li><hr className="dropdown-divider" /></li>
        <li>
          <Link className="dropdown-item" to="/dashboard">🏠 Acasă</Link>
        </li>
        <li>
          <button className="dropdown-item text-danger" onClick={handleLogout}>
            🚪 Deconectare
          </button>
        </li>
      </ul>
    </div>
    
  </div>
</nav>




<div className="container mb-4">
  <div className="card shadow-sm border-0 bg-light">
    <div className="card-body">
      <p className="mb-2">
        <strong>🔍 Informații:</strong> Această pagină afișează orarul generat pentru studenți, incluzând profesori și săli disponibile.
      </p>
      <p className="mb-0">
        <strong>ℹ️ Notă:</strong> Asigură-te că ai introdus toate regulile și informațiile necesare pentru generarea orarului.
      </p>
    </div>
  </div>
</div>



<div className="d-flex align-items-center mb-4 gap-3">
  {/* Afișare regulă selectată (dacă există) */}
  {regula_id && continutRegula && (
    <div className="card shadow-sm border-0 p-0 w-auto" style={{ fontSize: "0.75rem", maxWidth: "360px" }}>
      {denumireRegulaSelectata && (
        <div className="alert alert-info d-flex justify-content-between align-items-center m-0 py-1 px-2">
          <div>
            <i className="bi bi-check-circle-fill me-1 text-primary"></i>
            <strong>Regulă:</strong> <em>{denumireRegulaSelectata}</em>
          </div>
        </div>
      )}
    </div>
  )}


<label className="me-2 fw-semibold text-primary">🎯 Selectează anul:</label>
<select
  className="form-select w-auto me-3"
  value={anSelectat}
  onChange={(e) => setAnSelectat(e.target.value)}
>
  <option value="" disabled>-- Selectează anul --</option>
  {aniDisponibili.map((an, idx) => (
    <option key={idx} value={an}>
      {an}
    </option>
  ))}
</select>

<label className="me-2 fw-semibold text-primary">🏫 Selectează nivelul:</label>
<select
  className="form-select w-auto me-3"
  value={nivelSelectat}
  onChange={(e) => setNivelSelectat(e.target.value)}
>
  <option value="Licenta">Licență</option>
  <option value="Master">Master</option>
</select>

<button
  className="btn btn-success"
  onClick={genereazaOrar}
  disabled={loadingGPT || loadingClasic}
>
  {loadingGPT ? (
    <>
      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      Se generează...
    </>
  ) : (
    "🚀 Generează orar"
  )}
</button>

<button
  className="btn btn-outline-secondary"
  onClick={genereazaOrarClasic}
  disabled={loadingGPT || loadingClasic}
>
  {loadingClasic ? (
    <>
      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      Se generează clasic...
    </>
  ) : (
    "🧠 Generează clasic"
  )}
</button>


      </div>



{renderOrar()}
{raportValidare && (
  <>
    <div className="alert alert-info mt-4" style={{ whiteSpace: "pre-wrap" }}>
      <strong>📋 Raport de validare orar:</strong>
      <br />
      {raportValidare}
    </div>

    <div className="mt-5 text-center">
      <h5 className="mb-3">
        📥 Exportă orarul sau creează o altă generare.
      </h5>
      <button className="btn btn-success mx-2" onClick={exportPDF}>
        🖨️ Export PDF
      </button>
      <button className="btn btn-success mx-2" onClick={exportExcel}>
        ⬇ Export Excel
      </button>
      <button
      className="btn btn-outline-primary mx-2"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      ➕ Orar nou
    </button>

    </div>
  </>
)}






<div className="card shadow-sm border-0 mt-5">
  <div className="card-header bg-light fw-bold text-primary">
    📂 Orare salvate anterior
  </div>
  <div className="card-body p-0">
    <div className="p-3">
      <input
        type="text"
        className="form-control"
        placeholder="🔍 Caută orar după nume..."
        value={cautareOrar}
        onChange={(e) => setCautareOrar(e.target.value)}
      />
    </div>

    {orareFiltrate.length === 0 ? (
      <p className="text-muted px-3 pb-3 mb-0">Niciun orar găsit.</p>
    ) : (
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        <ul className="list-group list-group-flush">
          {orareFiltrate.map((orar) => (
            <li
              key={orar.id}
              className="list-group-item d-flex justify-content-between align-items-start flex-wrap"
            >
              <div className="me-auto">
                <div className="fw-semibold text-dark">
  📘 {orar.nume ? orar.nume : `${orar.nivel} – ${orar.an}`}
</div>

                <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                  {new Date(orar.data_creare).toLocaleString("ro-RO", {
                    timeZone: "UTC",
                    hour12: false,
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
              </div>
              <div className="d-flex gap-2 mt-2 mt-sm-0">
                    <button
        className="btn btn-sm btn-outline-success"
        onClick={() => editeazaDenumire(orar.id, orar.nume)}
      >
        ✏️ Editează
      </button>

              
               <button
  className="btn btn-sm btn-outline-primary"
  onClick={() => {
    incarcaOrarSalvat(orar.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }}
>
  🔄 Încarcă
</button>

                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => stergeOrar(orar.id)}
                >
                  🗑️ Șterge
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
</div>

  
      {/* FOOTER */}
      <footer className="bg-white text-center text-muted py-3 border-top mt-auto">
        <p className="mb-0">© {new Date().getFullYear()} Generator Orare</p>
      </footer>
    </div>
  );
  
};

export default GeneratedTimetable;