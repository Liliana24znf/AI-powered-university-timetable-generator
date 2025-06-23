import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import useProfesoriLogic from "../functiiLogice/dashboard/useProfesoriLogic";
import usePreventBack from "../functiiLogice/utils/usePreventBack";
import useScrollToTop from "../functiiLogice/utils/useScrollToTop";


const Profesori = () => {
  const {
    navigate,
    lista,
    formular,
    setFormular,
    touchedFields,
    setTouchedFields,
    profesorEditat,
    setProfesorEditat,
    loading,
    searchTerm,
    setSearchTerm,
    handleFormChange,
    handleDisciplinaChange,
    adaugaDisciplina,
    stergeDisciplina,
    toggleTipActivitate,
    toggleIntervalDisponibil,
    handleBlur,
    handleBlurDisciplina,
    adaugaProfesor,
    actualizeazaProfesor,
    stergeProfesor,
    resetFormular,
    fetchProfesori
  } = useProfesoriLogic();
  usePreventBack();
  useScrollToTop();
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
                text: "Datele nesalvate despre profesori vor fi pierdute. Ești sigur că vrei să revii la pagina de început?",
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

          <span className="text-primary fw-bold fs-4">👨‍🏫 Gestionare Profesori</span>
          <div className="position-absolute end-0 d-flex gap-2">
            <button
              className="btn btn-outline-danger"
              onClick={() => {
                Swal.fire({
                  title: "Revenire la săli?",
                  text: "Datele nesalvate despre profesori vor fi pierdute. Ești sigur că vrei să revii?",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Da, revin",
                  cancelButtonText: "Rămân aici"
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
                  title: "Reîncarcă profesorii?",
                  text: "Profesorii actuali vor fi reîncărcați din baza de date. Modificările nesalvate vor fi pierdute.",
                  icon: "question",
                  showCancelButton: true,
                  confirmButtonText: "Da, reîncarcă",
                  cancelButtonText: "Nu"
                }).then((result) => {
                  if (result.isConfirmed) {
                    fetchProfesori();
                    resetFormular();
                    setProfesorEditat(null);
                    setSearchTerm("");
                    setTouchedFields({
                      nume: false,
                      discipline: Array(formular.discipline.length).fill(false)
                    });
                    toast.info("🔄 Lista profesorilor a fost reîncărcată.");
                  }
                });
              }}
            >
              🔄 Reîncarcă
            </button>

            <button
              className="btn btn-outline-primary"
              onClick={() => {
                Swal.fire({
                  title: "Continui către reguli?",
                  text: "Asigură-te că ai salvat toți profeosrii înainte de a continua.",
                  icon: "info",
                  showCancelButton: true,
                  confirmButtonText: "Da, continuă",
                  cancelButtonText: "Rămân aici"
                }).then((result) => {
                  if (result.isConfirmed) navigate("/setare-reguli");
                  else toast.info("🔄 Rămâi aici pentru a adăuga sau modifica profesori.");
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
            <h4 className="fw-bold text-primary mb-3">👨‍🏫 Despre gestionarea profesorilor</h4>
            
            <p className="text-secondary mb-2">
              În această secțiune poți introduce <strong>profesorii disponibili</strong> pentru activitățile didactice:
              {" "} <strong>cursuri</strong>,{" "} <strong>seminarii</strong> și <strong>laboratoare</strong>.
            </p>

            <p className="text-secondary mb-2">
              Fiecare profesor trebuie să aibă completate informațiile despre
              {" "} <strong>nume</strong>,{" "} <strong>disciplinele predate</strong> (cu nivel și tip de activitate) și
              {" "} <strong>disponibilitatea săptămânală</strong>.
            </p>

            
            <p className="text-secondary mb-2">
              Apasă <strong>"Salvează profesor"</strong> pentru a adăuga un nou profesor în sistem.
            </p>

            
            <p className="text-secondary">
              Poți folosi <strong>"Reîncarcă"</strong> pentru a actualiza lista profesorilor și a vizualiza ultimele modificări efectuate.
            </p>
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-4">
        {/* Col stângă: formularul */}
        <div className="bg-white p-4 shadow-sm rounded" style={{ flex: "1 1 400px" }}>
          <h4 className="mb-4 text-primary fw-bold">
            {profesorEditat ? "🔁 Modifică profesorul existent" : "👨‍🏫 Adaugă un nou profesor"}
          </h4>

          <div className="mb-3">
            <label htmlFor="nume-complet" className="form-label fw-semibold">👤 Nume complet:</label>
            <input
              id="nume-complet"
              type="text"
              className={`form-control ${touchedFields.nume && isInvalid(formular.nume) ? "is-invalid" : ""}`}
              value={formular.nume}
              onChange={(e) => handleFormChange("nume", e.target.value)}
              onBlur={() => handleBlur("nume")}
              placeholder="ex: Dr. Andrei Popescu"
            />
            {touchedFields.nume && isInvalid(formular.nume) && (
              <div className="invalid-feedback">Numele profesorului este obligatoriu.</div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="discipline-predate" className="form-label fw-semibold">📘 Discipline predate:</label>

            {formular.discipline.map((disc, i) => (
              <div key={disc.id || i} className="card border-0 shadow-sm mb-3">
                <div className="card-body d-flex flex-wrap align-items-center gap-3">
                  <input
                    type="text"
                    className={`form-control ${touchedFields.discipline[i] && !disc.denumire ? "is-invalid" : ""}`}
                    placeholder="Denumire disciplină"
                    value={disc.denumire}
                    onChange={(e) => handleDisciplinaChange(i, "denumire", e.target.value)}
                    onBlur={() => handleBlurDisciplina(i)}
                  />
                  {touchedFields.discipline[i] && !disc.denumire && (
                    <div className="invalid-feedback">Denumirea disciplinei este obligatorie.</div>
                  )}

                  <select
                    className="form-select"
                    value={disc.nivel}
                    onChange={(e) => handleDisciplinaChange(i, "nivel", e.target.value)}
                    style={{ minInlineSize: 130 }}
                  >
                    <option value="">Selectează nivel</option>
                    <option value="Licenta">Licenta</option>
                    <option value="Master">Master</option>
                  </select>

                  <div className="d-flex gap-3 flex-wrap">
                    {["Curs", "Seminar", "Laborator", "Proiect"].map((tip) => (
                      <div key={tip} className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`tip-${i}-${tip}`}
                          checked={disc.tipuri?.includes(tip)}
                          onChange={() => toggleTipActivitate(i, tip)}
                        />
                        <label className="form-check-label" htmlFor={`tip-${i}-${tip}`}>
                          {tip}
                        </label>
                      </div>
                    ))}
                  </div>

                  {i > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm ms-auto"
                      onClick={() => stergeDisciplina(i)}
                      title="Șterge disciplina"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button className="btn btn-sm btn-outline-primary mt-2" onClick={adaugaDisciplina}>
              ➕ Adaugă altă disciplină
            </button>
          </div>
        </div>

        {/* Col dreaptă: disponibilitatea */}
        <div className="bg-white p-4 shadow-sm rounded" style={{ flex: "1 1 600px", minInlineSize: "350px" }}>
          <label htmlFor="disponibilitate" className="form-label fw-bold">📅 Disponibilitate săptămânală</label>
          <p className="text-muted mb-3">
            Selectează zilele și intervalele orare în care profesorul este disponibil.<br />
            Click pe o celulă pentru a o activa/dezactiva.
          </p>
          
        <div className="table-responsive">
          <table className="table table-bordered text-center align-middle shadow-sm">
            <thead className="table-primary">
              <tr>
                <th className="bg-light">🕓 Zile / Interval</th>
                {["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00", "18:00-20:00"].map((interval) => (
                  <th key={interval} className="small">{interval}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["Luni", "Marti", "Miercuri", "Joi", "Vineri"].map((zi) => (
                <tr key={zi}>
                  <td className="fw-semibold bg-light">{zi}</td>
                  {["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00", "18:00-20:00"].map((interval) => {
                    const esteSelectat = formular.disponibilitate[zi]?.includes(interval);
                    return (
                      <td
                        key={interval}
                        className={`cursor-pointer ${esteSelectat ? 'bg-success text-white fw-bold' : 'bg-white'} hover-shadow`}
                        style={{ transition: "0.2s", userSelect: "none" }}
                        onClick={() => toggleIntervalDisponibil(zi, interval)}
                      >
                        {esteSelectat ? "✔️" : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        </div>
      </div>

      <div className="d-flex justify-content-between mt-4">
        {profesorEditat ? (
          <>
            <button
              className="btn btn-warning"
              onClick={actualizeazaProfesor}
              disabled={loading}
            >
              {loading ? "Actualizare..." : "🔁 Actualizează"}
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={resetFormular}
            >
              ❌ Anulează
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-success"
              onClick={adaugaProfesor}
              disabled={loading}
              
            >
              {loading ? "Salvare..." : "✅ Salvează profesor"}
              
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={resetFormular}
            >
              🔄 Resetare
            </button>
          </>
        )}
      </div>

      <div className="bg-white p-4 shadow-sm rounded flex-grow-1" style={{ minInlineSize: 400 }}>
        <h5 className="mb-3">📋 Profesori existenți:</h5>

        <input
          type="text"
          className="form-control mb-3"
          placeholder="🔍 Caută profesor după nume..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {lista.filter(prof => prof.nume.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
          <div className="text-muted fst-italic px-2">Niciun profesor găsit.</div>
        )}

        <div className="row">
          {lista
            .filter(prof => prof.nume.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((prof) => (
              <div key={prof.id} className="col-md-6 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex flex-column">
                    {/* Nume profesor */}
                    <h5 className="card-title text-primary fw-semibold mb-2">
                      👨‍🏫 {prof.nume}
                    </h5>

                    {/* Discipline */}
                    <div className="mb-2">
                      <strong>📚 Discipline:</strong>
                      {prof.discipline?.length === 0 ? (
                        <p className="fst-italic text-muted">Nicio disciplină introdusă.</p>
                      ) : (
                        <div className="d-flex flex-wrap gap-2 mt-1">
                          {prof.discipline.map((d, i) => (
                            <span
                              key={d.id || `${d.denumire}-${i}`}
                              className="badge text-bg-light border border-primary-subtle px-3 py-2"
                            >
                              {d.denumire} – <span className="text-info">{d.tipuri?.join(", ")}</span>{" "}
                              <small className="text-muted">({d.nivel})</small>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Disponibilitate */}
                    <div className="mb-2">
                      <strong>🕒 Disponibilitate:</strong>
                      {prof.disponibilitate && Object.keys(prof.disponibilitate).length > 0 ? (
                        <ul className="mb-0 mt-1 ps-3">
                          {["Luni", "Marti", "Miercuri", "Joi", "Vineri"].map((zi) => (
                            <li key={zi}>
                              <strong>{zi}:</strong>{" "}
                              {prof.disponibilitate?.[zi]?.length > 0 ? (
                                prof.disponibilitate[zi].join(", ")
                              ) : (
                                <span className="text-muted fst-italic">Nu este disponibil(ă)</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="fst-italic text-muted">Nicio disponibilitate setată.</p>
                      )}
                    </div>

                    {/* Butoane acțiuni */}
                    <div className="d-flex justify-content-end gap-2 mt-auto pt-3">
                      <button
                        className="btn btn-outline-warning btn-sm"
                        onClick={() => {
                          setProfesorEditat(prof);

                          const disciplineCopiate = prof.discipline.map(d => ({
                            denumire: d.denumire || "",
                            nivel: d.nivel || "",
                            tipuri: d.tipuri || []
                          }));

                          setFormular({
                            nume: prof.nume || "",
                            discipline: disciplineCopiate,
                            disponibilitate: prof.disponibilitate || {}
                          });

                          window.scrollTo({ insetBlockStart: 0, behavior: "smooth" });
                        }}
                      >
                        <span className="text-warning">✏️</span> Editează
                      </button>

                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => stergeProfesor(prof.id)}
                      >
                        🗑️ Șterge
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Footer */}
        <footer className="bg-light text-center py-4 mt-auto">
          <p className="mb-0">© 2023 Generator Orare. Toate drepturile rezervate.</p>
        </footer>
      </div>

    </div>
  );
};

export default Profesori;
