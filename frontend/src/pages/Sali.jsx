import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useEffect } from "react";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import useSaliLogic from "../functiiLogice/useSaliLogic";

const Sali = () => {
  const navigate = useNavigate();
  const {
    numarCursuri, setNumarCursuri,
    numarLaboratoare, setNumarLaboratoare,
    numarSeminare, setNumarSeminare,
    numarProiecte, setNumarProiecte,
    saliGenerat, saliSelectate,
    isLoading, resetKey,
    genereazaSali, stergeSelectie,
    toggleSelectSala, toggleSelectAllByTip,
    getTitluSala, fetchSali
  } = useSaliLogic();

useEffect(() => {
  const handlePopState = (e) => {
    e.preventDefault();
    window.history.pushState(null, "", window.location.href);
  };

  window.history.pushState(null, "", window.location.href);
  window.addEventListener("popstate", handlePopState);

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}, []);

  return (
    <div className="container-fluid pt-4 px-4">
      <ToastContainer />
      <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 mb-4">
        <div className="container-fluid position-relative d-flex justify-content-center align-items-center">
          <button
            type="button"
            className="position-absolute start-0 text-primary fw-bold fs-4 text-decoration-none btn btn-link p-0"
            style={{ cursor: "pointer" }}
            onClick={() => {
              Swal.fire({
                title: "Părăsești această pagină?",
                text: "Datele nesalvate despre săli vor fi pierdute. Ești sigur că vrei să revii la pagina de început?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Da, sunt sigur(ă)",
                cancelButtonText: "Rămâi aici"
              }).then((result) => {
                if (result.isConfirmed) {
                  navigate("/dashboard");
                }
              });
            }}
          >
            <span className="fs-6 fw-bold">Aplicație pentru planificare inteligentă</span>
            <span className="fs-6 m-0 d-flex flex-column align-items-start justify-content-center text-decoration-none">
              utilizând tehnici de A.I.
            </span>
          </button>

          <span className="text-primary fw-bold fs-4">🏫 Gestionare Săli</span>
          <div className="position-absolute end-0 d-flex gap-2">
            <button
              className="btn btn-outline-danger"
              onClick={() => {
                Swal.fire({
                  title: "Revenire la grupe?",
                  text: "Datele nesalvate despre săli vor fi pierdute. Ești sigur că vrei să revii?",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Da, revin",
                  cancelButtonText: "Rămân aici",
                }).then((result) => {
                  if (result.isConfirmed) navigate("/grupe");
                });
              }}
            >
              🔙 Înapoi
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                Swal.fire({
                  title: "Reîncarcă sălile?",
                  text: "Sălile actuale vor fi reîncărcate din baza de date. Modificările nesalvate vor fi pierdute.",
                  icon: "question",
                  showCancelButton: true,
                  confirmButtonText: "Da, reîncarcă",
                  cancelButtonText: "Nu",
                }).then((result) => {
                  if (result.isConfirmed) fetchSali();
                });
              }}
            >
              🔄 Reîncarcă
            </button>

            <button
              className="btn btn-outline-primary"
              onClick={() => {
                Swal.fire({
                  title: "Continui către profesori?",
                  text: "Asigură-te că ai salvat toate sălile înainte de a continua.",
                  icon: "info",
                  showCancelButton: true,
                  confirmButtonText: "Da, continuă",
                  cancelButtonText: "Rămân aici",
                }).then((result) => {
                  if (result.isConfirmed) navigate("/profesori");
                });
              }}
            >
              ➡ Continuă
            </button>
          </div>
        </div>
      </nav>

      <div className="row mb-4">
        <div className="col-md-8 mx-auto">
          <div className="bg-white border-start border-4 border-primary p-4 rounded shadow-sm">
            <h4 className="fw-bold text-primary mb-3">ℹ️ Despre gestionarea sălilor</h4>
            <p className="text-secondary mb-2">
              În această secțiune poți introduce <strong>numărul de săli necesare</strong> pentru desfășurarea activităților didactice: <strong>cursuri</strong>, <strong>laboratoare</strong> și <strong>seminarii</strong>.
            </p>
            <p className="text-secondary mb-2">
              Asigură-te că toate sălile sunt completate corect înainte de a genera orarul.
            </p>
            <p className="text-secondary mb-2">
              Apasă <strong>"Salvează"</strong> pentru a adăuga noile săli în sistem.
            </p>
            <p className="text-secondary">
              Poți folosi <strong>"Reîncarcă"</strong> pentru a actualiza lista și a vizualiza ultimele modificări efectuate.
            </p>
          </div>
        </div>
      </div>

      <div className="row mb-4 flex-nowrap overflow-auto">
        {[
          { label: "📘 Săli de Curs (GC)", state: numarCursuri, set: setNumarCursuri, color: "primary", placeholder: "ex: 3" },
          { label: "🧪 Săli de Laborator (GL)", state: numarLaboratoare, set: setNumarLaboratoare, color: "success", placeholder: "ex: 2" },
          { label: "📝 Săli de Seminar (GS)", state: numarSeminare, set: setNumarSeminare, color: "warning", placeholder: "ex: 1" },
          { label: "💼 Săli de Proiect (GP)", state: numarProiecte, set: setNumarProiecte, color: "info", placeholder: "ex: 2" },
        ].map(({ label, state, set, color, placeholder }) => (
          <div key={label} className="col-md-3" style={{ minInlineSize: "280px" }}>
            <div className={`card border-start border-3 border-${color} shadow-sm h-100`}>
              <div className="card-body">
                <h6 className={`fw-bold text-${color} mb-2`}>{label}</h6>
                <input
                  type="number"
                  className="form-control"
                  placeholder={placeholder}
                  min="0"
                  value={state}
                  onChange={(e) => set(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mb-4">
        <button
          className="btn btn-success px-5 py-2 fw-semibold shadow-sm"
          onClick={genereazaSali}
          disabled={isLoading}
        >
          {isLoading ? "⏳ Se salvează..." : "✅ Salvează sălile"}
        </button>
      </div>

      {!saliGenerat.length && (
        <div className="alert alert-info text-center">
          📭 Nu există săli înregistrate momentan. Adaugă câteva folosind formularul de mai sus.
        </div>
      )}

      <div className="row mb-4 justify-content-start">
        {["Curs", "Laborator", "Seminar", "Proiect"].map((tip) => {
          let culoare = "info";
          if (tip === "Curs") culoare = "primary";
          else if (tip === "Laborator") culoare = "success";
          else if (tip === "Seminar") culoare = "warning";

          const saliFiltrate = saliGenerat
            .filter((s) => s.tip === tip)
            .sort(
              (a, b) =>
                parseInt(a.cod.replace(/\D/g, "")) -
                parseInt(b.cod.replace(/\D/g, ""))
            );

          return (
            <div key={`${tip}-${resetKey}`} className="col-lg-3 col-md-4 col-sm-6 mb-3">
              <div className={`card shadow-sm h-100 border-start border-4 border-${culoare}`}>
                <div className="card-body">
                  <h5 className={`fw-bold text-${culoare} mb-3`}>
                    {getTitluSala(tip)}
                  </h5>

                  {saliFiltrate.length === 0 ? (
                    <div className="text-muted fst-italic">
                      ⚠️ Nu există săli de tip {tip} în sistem.
                    </div>
                  ) : (
                    <>
                      <div className="form-check form-switch mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`selectAll-${tip}`}
                          checked={saliFiltrate.every((s) => saliSelectate.includes(s.cod))}
                          onChange={(e) => toggleSelectAllByTip(tip, e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor={`selectAll-${tip}`}>
                          Selectează toate
                        </label>
                      </div>

                      <p className="text-muted small mt-2">Total: {saliFiltrate.length} săli</p>
                      <ul className="list-group">
                        {saliFiltrate.map((s) => (
                          <li key={s.cod} className="list-group-item d-flex align-items-center">
                            <input
                              type="checkbox"
                              className="form-check-input me-2"
                              checked={saliSelectate.includes(s.cod)}
                              onChange={() => toggleSelectSala(s.cod)}
                            />
                            {s.cod}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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

      <footer className="bg-light text-center py-4 mt-auto">
        <p className="mb-0">© 2023 Generator Orare. Toate drepturile rezervate.</p>
      </footer>
    </div>
  );
};

export default Sali;
