import React from "react";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import usePreventBack from "../functiiLogice/usePreventBack";
import useGrupeLogic from "../functiiLogice/useGrupeLogic";

const Grupe = () => {
  const {
    nivel, setNivel,
    an, setAn,
    nrGrupe, setNrGrupe,
    nrSubgrupe, setNrSubgrupe,
    grupeGenerat, grupeSelectate,
    grupaNoua, setGrupaNoua,
    isLoading, searchTerm, setSearchTerm,
    editSectiune, setEditSectiune,
    genereazaGrupe, adaugaGrupaIndividuala,
    stergeGrupa, stergeSelectie,
    toggleSelect, grupePeNivelSiAn,
    fetchGrupe,
    handleEditSectiune, handleToggleAll,
  } = useGrupeLogic();

  const navigate = useNavigate();


usePreventBack();
  // ✅ Extragem afișarea în funcție de stare (fără ternare)
  let continutGrupe;
  if (isLoading) {
    continutGrupe = (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" />
      </div>
    );
  } else if (grupeGenerat.length === 0) {
    continutGrupe = (
      <div className="text-center text-muted">
        <i className="bi bi-folder-x fs-1 d-block mb-2" />
        <span>Nu există grupe înregistrate momentan.</span>
      </div>
    );
  } else if (grupePeNivelSiAn().length === 0) {
    continutGrupe = (
      <div className="text-center text-secondary py-5">
        <i className="bi bi-emoji-frown fs-1 text-warning mb-3 d-block" />
        <h5 className="fw-bold">Nicio grupă găsită</h5>
        <p className="mb-0">Verifică termenul introdus.</p>
      </div>
    );
  } else {
    continutGrupe = grupePeNivelSiAn().map((sectiune) => {
      const esteInEditare =
        editSectiune?.nivel === sectiune.titlu.split(' - ')[0] &&
        editSectiune?.an === sectiune.titlu.split(' - ')[1].replace('Anul ', '');
      const toateSelectate = sectiune.grupe.every((gr) => grupeSelectate.includes(gr.denumire));
      const selectAllLabel = toateSelectate ? "❌ Deselectează toate" : "✅ Selectează toate";

      return (
        <div key={sectiune.titlu} className="mb-4">
          <h6 className="fw-bold d-flex justify-content-between align-items-center text-secondary">
            {sectiune.titlu}
            <div>
              <button className="btn btn-sm btn-outline-secondary me-2 rounded-3" onClick={() => handleEditSectiune(sectiune.titlu)}>✏️ Editează</button>
              <button className="btn btn-sm btn-outline-primary rounded-3" onClick={() => handleToggleAll(sectiune)}>{selectAllLabel}</button>
            </div>
          </h6>

          <ul className="list-group">
            {sectiune.grupe.map((gr) => (
              <li key={gr.denumire} className="list-group-item d-flex align-items-center border-0 border-bottom py-2">
                <input type="checkbox" className="form-check-input me-3" checked={grupeSelectate.includes(gr.denumire)} onChange={() => toggleSelect(gr.denumire)} />
                <div className="d-flex flex-column">
                  <span className="fw-bold text-dark">🧑‍🎓 {gr.denumire}</span>
                  <div className="small text-muted">
                    <span className="badge bg-primary me-1">{gr.nivel}</span>
                    <span className="badge bg-secondary me-1">An {gr.an}</span>
                    <span className="badge bg-success me-1">Grupa {gr.grupa}</span>
                    {gr.subgrupa && <span className="badge bg-info text-dark">Subgrupa {gr.subgrupa}</span>}
                  </div>
                </div>
                <button className="btn btn-sm btn-outline-danger ms-auto rounded-3" onClick={() => stergeGrupa(gr.denumire)}>🗑️</button>
              </li>
            ))}
          </ul>

          {esteInEditare && (
            <div className="card bg-light p-3 mt-3 border-0 rounded-3">
              <h6 className="fw-bold mb-3">➕ Adaugă o grupă nouă (ex: 2b)</h6>
              <div className="input-group">
                <input className="form-control" value={grupaNoua} onChange={(e) => setGrupaNoua(e.target.value)} placeholder="ex: 2b" />
                <button className="btn btn-success" onClick={adaugaGrupaIndividuala}>Adaugă</button>
                <button className="btn btn-outline-secondary" onClick={() => { setEditSectiune(null); setGrupaNoua(""); }}>Anulează</button>
              </div>
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <div className="container-fluid pt-4 px-4">
      <ToastContainer />

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 mb-4">
        <div className="container-fluid position-relative d-flex justify-content-center align-items-center">
          <button
            type="button"
            className="position-absolute start-0 text-primary fw-bold fs-4 text-decoration-none btn btn-link p-0"
            style={{ cursor: "pointer" }}
            onClick={() => {
              Swal.fire({
                title: "Părăsești această pagină?",
                text: "Datele nesalvate despre grupe vor fi pierdute.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Da",
                cancelButtonText: "Rămân"
              }).then((result) => {
                if (result.isConfirmed) navigate("/dashboard");
              });
            }}
          >
            <span className="fs-6 fw-bold">Aplicație pentru planificare inteligentă</span>
            <span className="fs-6 m-0 d-flex flex-column align-items-start justify-content-center text-decoration-none">utilizând tehnici de A.I.</span>
          </button>

          <span className="text-primary fw-bold fs-4">👥 Gestionare Grupe</span>

          <div className="position-absolute end-0 d-flex gap-2">
            <button className="btn btn-outline-danger" onClick={() => {
              Swal.fire({
                title: "Revenire?",
                text: "Datele nesalvate vor fi pierdute.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Da",
                cancelButtonText: "Nu"
              }).then((r) => { if (r.isConfirmed) navigate("/dashboard"); });
            }}>🔙 Înapoi</button>

            <button className="btn btn-outline-secondary" onClick={() => {
              Swal.fire({
                title: "Reîncarcă grupele?",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Da",
                cancelButtonText: "Nu"
              }).then((r) => { if (r.isConfirmed) fetchGrupe(); });
            }}>🔄 Reîncarcă</button>

            <button className="btn btn-outline-primary" onClick={() => {
              Swal.fire({
                title: "Continui către săli?",
                text: "Asigură-te că ai salvat grupele.",
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Da",
                cancelButtonText: "Nu"
              }).then((r) => { if (r.isConfirmed) navigate("/sali"); });
            }}>➡ Continuă</button>
          </div>
        </div>
      </nav>

      {/* Secțiune informativă */}
      <div className="row mb-4">
        <div className="col-md-8 mx-auto">
          <div className="bg-white border-start border-4 border-primary p-4 rounded shadow-sm">
            <h4 className="fw-bold text-primary mb-3">ℹ️ Despre gestionarea grupelor</h4>
            <p className="text-secondary mb-2">Configurează grupele și subgrupele pentru fiecare an, atât la <strong>Licență</strong> cât și la <strong>Master</strong>.</p>
            <p className="text-secondary">Aceste grupe vor fi folosite la <strong>generarea orarului</strong>.</p>
          </div>
        </div>
      </div>

      <div className="row justify-content-center gx-5 mb-5">
        {/* Formular configurare */}
        <div className="col-md-4">
          <div className="card border-0 shadow rounded-4 p-4 bg-white">
            <h4 className="mb-4 text-primary fw-bold text-center">⚙️ Configurare Grupe</h4>

            <label className="form-label fw-semibold" htmlFor="nivel-select">Nivel:</label>
            <select id="nivel-select" className="form-select rounded-3 mb-3" value={nivel} onChange={(e) => setNivel(e.target.value)}>
              <option value="Licenta">Licență</option>
              <option value="Master">Master</option>
            </select>

            <label className="form-label fw-semibold" htmlFor="an-select">An:</label>
            <select id="an-select" className="form-select rounded-3 mb-3" value={an} onChange={(e) => setAn(e.target.value)}>
              <option value="I">I</option><option value="II">II</option><option value="III">III</option><option value="IV">IV</option>
            </select>

            <label className="form-label fw-semibold" htmlFor="nrGrupe-input">Număr Grupe:</label>
            <input id="nrGrupe-input" type="number" className="form-control rounded-3 mb-3" min="1" value={nrGrupe} onChange={(e) => setNrGrupe(parseInt(e.target.value) || 1)} />

            <label className="form-label fw-semibold" htmlFor="nrSubgrupe-input">Subgrupe / Grupa:</label>
            <input id="nrSubgrupe-input" type="number" className="form-control rounded-3 mb-4" min="1" value={nrSubgrupe} onChange={(e) => setNrSubgrupe(parseInt(e.target.value) || 1)} />

            <button className="btn btn-primary w-100 rounded-3 fw-bold" onClick={genereazaGrupe}>✅ Generează Grupe</button>
          </div>
        </div>


        {/* 📋 Afișare grupe */}
        <div className="col-md-7">
          <div className="card border-0 shadow rounded-4 p-4 bg-white">
            <h5 className="mb-4 text-primary fw-bold">📋 Grupe existente</h5>
            <input type="text" className="form-control rounded-3 mb-3" placeholder="🔍 Caută după denumire..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {continutGrupe}
          </div>
        </div>
      </div>

      {/* Ștergere selecție */}
      {grupeGenerat.length > 0 && (
        <div className="text-end mt-3">
          <button className="btn btn-danger" onClick={stergeSelectie}>🗑️ Șterge selecția</button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-light text-center py-4 mt-auto">
        <p className="mb-0">© {new Date().getFullYear()} Generator Orare. Toate drepturile rezervate.</p>
      </footer>
    </div>
  );
};

export default Grupe;
