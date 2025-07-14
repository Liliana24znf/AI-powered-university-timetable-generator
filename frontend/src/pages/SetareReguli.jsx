import Swal from "sweetalert2";
import useSetariReguli from "../functiiLogice/dashboard/useSetariReguli";
import usePreventBack from "../functiiLogice/utils/usePreventBack";
import useScrollToTop from "../functiiLogice/utils/useScrollToTop";
import React from "react";


const SetareReguli = () => {
  const {
    navigate,
    reguli,
    setReguli,
    idRegulaEditata,
    setIdRegulaEditata,
    reguliFiltrate,
    setReguliFiltrate,
    ultimeleReguli,
    setUltimeleReguli,
    numeRegula,
    setNumeRegula,
    loading,
    salveazaReguli,
    regulaVizibila,
    setLoading,
  reincarcaUltimeleReguli 
  } = useSetariReguli();

useScrollToTop();
usePreventBack();


  return (
    <div className="container-fluid pt-4 px-4">
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 mb-4">
        <div className="container-fluid position-relative d-flex justify-content-center align-items-center">

          {/* Buton Stânga */}
          <button
            type="button"
            className="position-absolute start-0 text-primary fw-bold fs-4 text-decoration-none btn btn-link p-0"
            style={{ cursor: "pointer" }}
            onClick={() => {
              Swal.fire({
                title: "Părăsești această pagină?",
                text: "Datele nesalvate despre reguli vor fi pierdute. Ești sigur că vrei să revii la pagina de început?",
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
            <span className="fs-6 m-0 d-flex flex-column align-items-start justify-content-center text-decoration-none">utilizând tehnici de AI</span>
          </button>

          {/* Titlu Centrat */}
          <span className="text-primary fw-bold fs-4">🧠 Setare Reguli</span>

          {/* Butoane Dreapta */}
          <div className="position-absolute end-0 d-flex gap-2">

            {/* Înapoi */}
            <button
              className="btn btn-outline-danger"
              onClick={() => {
                Swal.fire({
                  title: "Revenire la profesori?",
                  text: "Datele nesalvate despre reguli vor fi pierdute. Ești sigur că vrei să revii?",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Da, revin",
                  cancelButtonText: "Rămân aici",
                }).then((result) => {
                  if (result.isConfirmed) navigate("/profesori");
                });
              }}
            >
              🔙 Înapoi
            </button>

            {/* Reîncarcă */}
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                Swal.fire({
                  title: "Reîncarci regulile?",
                  text: "Regulile actuale vor fi reîncărcate din baza de date. Modificările nesalvate vor fi pierdute.",
                  icon: "question",
                  showCancelButton: true,
                  confirmButtonText: "Da, reîncarcă",
                  cancelButtonText: "Nu",
                }).then((result) => {
                  if (result.isConfirmed) {
                    window.location.reload();
                  }
                });
              }}
            >
              🔄 Reîncarcă
            </button>

            {/* Continuă */}
            <button
  className="btn btn-outline-primary"
  onClick={() => {
    // 🔍 Verificare regulă înainte de confirmare
    if (!idRegulaEditata) {
      Swal.fire({
        icon: "info",
        title: "Regulă neselectată",
        text: "Pentru a continua, te rog selectează sau salvează o regulă.",
      });
      return;
    }

    // ✅ Confirmare dacă regula este selectată
    Swal.fire({
      title: "Continui spre generare?",
      html: `Vei genera orarul pe baza regulii:<br><strong>${numeRegula}</strong>. <br> Asigură-te că ai salvat toate modificările înainte de a continua.`,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Da, continuă",
      cancelButtonText: "Rămân aici",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/orar-generat", {
          state: {
            regula_id: idRegulaEditata,
            denumire: numeRegula,
            continut: reguli,
          },
        });
      }
    });
  }}
  disabled={loading}
>
  {loading ? (
    <>
      <span
        className="spinner-border spinner-border-sm me-2"
        role="status"
        aria-hidden="true"
      ></span>
      Se salvează...
    </>
  ) : (
    "✅ Continuă"
  )}
</button>


          </div>
        </div>
      </nav>

      <div className="row mb-4">
        <div className="col-md-8 mx-auto">
          <div className="bg-white border-start border-4 border-primary p-4 rounded shadow-sm">
            <h4 className="fw-bold text-primary mb-3">📋 Despre setarea regulilor</h4>
            <p className="text-secondary mb-2">
              În această secțiune poți introduce <strong>regulile care guvernează generarea orarului</strong> pentru toate grupele și subgrupele din învățământul de <strong>Licență</strong> și <strong>Masterat</strong>.
            </p>
            <p className="text-secondary mb-2">
              Regulile trebuie să includă informații clare despre <strong>structura activităților</strong> (curs, seminar, proiect, laborator), <strong>intervalele orare permise</strong>, <strong>restricții de săli</strong> și <strong>programul zilnic</strong> pentru fiecare nivel.
            </p>
            <p className="text-secondary mb-2">
              După completare, apasă <strong>"Salvează și continuă"</strong> pentru a înregistra regulile în baza de date și a trece la generarea orarului.
            </p>
            <p className="text-secondary">
              Poți folosi <strong>"Reîncarcă"</strong> pentru a reseta pagina în cazul în care dorești să reîncepi editarea regulilor de la zero.
            </p>
          </div>
        </div>
      </div>

      {/* CONȚINUT */}
      <div className="container-lg">
        <div className="row">

        {numeRegula.trim() === "" ? (
          <div className="alert alert-danger d-flex justify-content-between align-items-center mt-3">
            <div>
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Mai întâi trebuie să <strong>creezi</strong> sau să <strong>selectezi o regulă</strong> pentru a continua.
            </div>
            <span className="badge bg-danger">Nespecificată</span>
          </div>
        ) : (
          <div className="alert alert-warning d-flex justify-content-between align-items-center mt-3">
            <div>
              <i className="bi bi-info-circle me-2"></i>
              Mergi mai departe cu{" "}
              {idRegulaEditata ? (
                <>
                  <strong>regula selectată:</strong>{" "}
                  <em className="text-dark">{numeRegula}</em>
                </>
              ) : (
                <>
                  <strong>regula personalizată</strong> creată chiar acum.
                </>
              )}
            </div>
            <span className="badge bg-primary text-light">
              📘 {numeRegula}
            </span>
          </div>
        )}

          {/* Coloana Stânga – Rei */}
          <div className="col-md-8">
          <div className="card shadow-sm border-0 mb-4 h-100">

          <div className="card shadow-sm border-0 mb-4 h-100">

            <div
              className="card-header d-flex align-items-center py-3 px-4 border-bottom shadow-sm rounded-top"
              style={{
                backgroundColor: "#f8f9fa",
                borderInlineStart: "5px solid #0d6efd"
              }}
            >
              <i className="bi bi-journal-code me-3 text-primary fs-5"></i>
              <span className="fw-semibold text-dark fs-6">
                REGULI STRICTE PENTRU GENERAREA ORARULUI
              </span>
            </div>

            {/* Aici poți adăuga conținutul cardului (ex: body-ul cu reguli, formular, etc.) */}
            <div className="card-body px-4 py-3">
              {/* Exemplu: */}
              {/* <p className="text-muted mb-0">Aici apar regulile introduse manual sau selectate din bază.</p> */}
            </div>

          </div>


          <div className="card-body px-4 py-4">
            {/* Textarea pentru reguli */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-secondary d-flex align-items-center mb-2">
                <i className="bi bi-pencil-square me-2 text-primary fs-5"></i>
                ✏️ Reguli de generare
              </label>
              <textarea
                className="form-control shadow-sm"
                style={{
                  fontFamily: "'Fira Code', monospace",
                  whiteSpace: "pre-wrap",
                  backgroundColor: "#fefefe",
                  border: "1px solid #ced4da",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  fontSize: "0.95rem",
                  resize: "vertical",
                }}
                rows={20}
                placeholder="📜 Scrie aici regulile pentru generarea orarului..."
                value={reguli}
                onChange={(e) => setReguli(e.target.value)}
              />
            </div>

            {/* Afișare informație despre regula selectată */}
            {idRegulaEditata && (
              <div className="card border-start border-4 border-primary shadow-sm mb-4">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <i className="bi bi-check-circle-fill me-2 text-primary fs-5"></i>
                    <span className="fw-semibold">Regulă selectată:</span>{" "}
                    <em className="text-dark">{numeRegula}</em>
                  </div>
                  <span className="badge bg-primary px-3 py-2">ID #{idRegulaEditata}</span>
                </div>
              </div>
            )}

            {/* Input pentru denumire regulă */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-secondary">📝 Denumire regulă</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-type"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Ex: Reguli orare Licență și Master"
                  value={numeRegula}
                  onChange={(e) => setNumeRegula(e.target.value)}
                  style={{ borderRadius: "0 0.375rem 0.375rem 0" }}
                />
              </div>
            </div>

            {/* Alerte și acțiuni pentru regulă existentă */}
            {idRegulaEditata && (
              <div className="alert alert-warning border-start border-4 border-warning-subtle shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 p-3 mt-3">
                <div>
                  <i className="bi bi-pencil-square me-2 text-warning"></i>
                  <strong>Modifici o regulă existentă:</strong>{" "}
                  <em className="text-dark">{numeRegula}</em>
                </div>

                <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                  {/* Actualizează */}
                  <button
                    className="btn btn-sm btn-success"
                    disabled={loading}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const response = await fetch("http://localhost:5000/actualizeaza_regula", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id: idRegulaEditata,
                            reguli,
                            denumire: numeRegula,
                          }),
                        });
                        const data = await response.json();
                        if (data.success) {
                          Swal.fire("Actualizat!", "Regula a fost actualizată.", "success");

                          const refresh = await fetch("http://localhost:5000/ultimele_reguli");
                          const noi = await refresh.json();
                          setUltimeleReguli(noi);
                          await reincarcaUltimeleReguli();


                          const regulaActualizata = noi.find(r => r.id === idRegulaEditata);
                          if (regulaActualizata) {
                            setReguli(regulaActualizata.continut);
                            setNumeRegula(regulaActualizata.denumire);
                            setIdRegulaEditata(regulaActualizata.id);
                          }

                          window.scrollTo(0, 0);
                        } else {
                          throw new Error(data.error || "Eroare necunoscută");
                        }
                      } catch (e) {
                        Swal.fire("Eroare", e.message, "error");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    💾 Actualizează
                  </button>

                  {/* Salvează ca nouă */}
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={loading}
                    onClick={async () => {
                      const regulaOriginala = ultimeleReguli.find((r) => r.id === idRegulaEditata);

                      if (regulaOriginala && regulaOriginala.denumire === numeRegula.trim()) {
                        Swal.fire({
                          icon: "warning",
                          title: "Denumirea este neschimbată",
                          text: "Te rog să alegi o denumire diferită pentru a salva ca regulă nouă.",
                        });
                        return;
                      }

                      try {
                        setLoading(true);
                        const response = await fetch("http://localhost:5000/salveaza_reguli", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ reguli, denumire: numeRegula }),
                        });

                        const data = await response.json();
                        if (data.success) {
                          Swal.fire("✅ Regula salvată", "Regula a fost salvată ca una nouă.", "success");
                          setIdRegulaEditata(null);
                          setNumeRegula("");
                          const refresh = await fetch("http://localhost:5000/ultimele_reguli");
                          const noi = await refresh.json();
                          setUltimeleReguli(noi);
                          await reincarcaUltimeleReguli();

                          window.scrollTo(0, 0);
                        } else {
                          throw new Error(data.error || "Eroare necunoscută");
                        }
                      } catch (e) {
                        Swal.fire("Eroare", e.message, "error");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    💡 Salvează ca nouă
                  </button>

                  {/* Șterge */}
                  <button
                    className="btn btn-sm btn-danger"
                    disabled={loading}
                    onClick={() => {
                      Swal.fire({
                        title: "Sigur vrei să ștergi această regulă?",
                        text: `Regula: ${numeRegula}`,
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Da, șterge",
                        cancelButtonText: "Anulează",
                      }).then(async (result) => {
                        if (result.isConfirmed) {
                          try {
                            setLoading(true);
                            const response = await fetch("http://localhost:5000/sterge_regula", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: idRegulaEditata }),
                            });

                            const data = await response.json();
                            if (data.success) {
                              Swal.fire("✅ Ștearsă", "Regula a fost ștearsă cu succes.", "success");
                              setIdRegulaEditata(null);
                              setNumeRegula("");
                              setReguli(regulaVizibila);

                              const refresh = await fetch("http://localhost:5000/ultimele_reguli");
                              const noi = await refresh.json();
                              setUltimeleReguli(noi);
                              await reincarcaUltimeleReguli();

                            } else {
                              throw new Error(data.error || "Eroare necunoscută");
                            }
                          } catch (e) {
                            Swal.fire("Eroare", e.message, "error");
                          } finally {
                            setLoading(false);
                            window.scrollTo(0, 0);
                          }
                        }
                      });
                    }}
                  >
                    🗑️ Șterge
                  </button>

                  {/* Anulează */}
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setIdRegulaEditata(null);
                      setNumeRegula("");
                      setReguli(regulaVizibila);
                      Swal.fire({
                        icon: "info",
                        title: "Editare anulată",
                        text: "Ai revenit la regula inițială.",
                      });
                      window.scrollTo(0, 0);
                    }}
                  >
                    ❌ Anulează
                  </button>
                </div>
              </div>
            )}

            {/* Butoane acțiune */}
            <div className="d-flex flex-wrap gap-3 mb-5 mt-3">
              {/* Salvează */}
              <button
                className="btn btn-success d-flex align-items-center"
                onClick={salveazaReguli}
                disabled={loading}
                
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Se salvează...
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-up me-2"></i>
                    🚀 Salvează
                  </>
                )}
              </button>

              {/* Golește */}
              <button
                className="btn btn-outline-danger d-flex align-items-center"
                onClick={() => {
                  if (!reguli.trim()) return;

                  Swal.fire({
                    title: "Ești sigur?",
                    text: "Toate regulile introduse vor fi șterse.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Da, șterge",
                    cancelButtonText: "Anulează",
                  }).then((result) => {
                    if (result.isConfirmed) setReguli("");
                  });
                }}
              >
                <i className="bi bi-x-circle me-2"></i>
                🔄 Golește
              </button>
            </div>
          </div>

          </div>
          </div>

          {/* Coloana Dreapta – Reguli */}
          <div className="col-md-4">
            <div className="card shadow-sm border-0 mb-4 h-100">
              <div className="card-header bg-light border-bottom fw-semibold text-primary fs-6 d-flex align-items-center">
                <i className="bi bi-folder2-open me-2"></i> Reguli salvate recent
              </div>

              <div className="card-body px-3 pt-3" style={{ blockSize: "650px", overflowY: "auto" }}>
                {/* Input de căutare */}
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 Caută după denumire..."
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      const filtrate = ultimeleReguli.filter((r) =>
                        r.denumire.toLowerCase().includes(query)
                      );
                      setReguliFiltrate(filtrate);
                    }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    title="Resetează"
                    onClick={() => setReguliFiltrate(ultimeleReguli)}
                  >
                    ✖
                  </button>
                </div>

                {/* Listă reguli filtrate */}
                {reguliFiltrate.length === 0 ? (
                  <div className="text-center text-muted p-4">
                    <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                    <p className="mb-0">Nu există reguli salvate.</p>
                  </div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {reguliFiltrate.map((r) => (
                      <li
                        key={r.id}
                        className="list-group-item d-flex justify-content-between align-items-center px-3 py-3 list-group-item-hover"
                        style={{
                          backgroundColor: r.id === idRegulaEditata ? "#e7f3ff" : "transparent",
                          cursor: "pointer",
                          transition: "background 0.3s",
                          borderBlockEnd: "1px solid #f0f0f0",
                        }}
                        onClick={() => {
                          Swal.fire({
                            title: "Încarci această regulă?",
                            html: `<strong>${r.denumire}</strong><br/><small>${new Date(r.data_adaugare).toLocaleString()}</small>`,
                            icon: "question",
                            showCancelButton: true,
                            confirmButtonText: "Da, încarcă",
                            cancelButtonText: "Nu",
                          }).then((result) => {
                            if (result.isConfirmed) {
                              setReguli(r.continut);
                              setNumeRegula(r.denumire);
                              setIdRegulaEditata(r.id);
                              Swal.fire({
                                icon: "success",
                                title: "Regula încărcată",
                                text: `Regula "${r.denumire}" a fost încărcată cu succes.`,
                                showConfirmButton: false,
                                timer: 1500,
                              });
                              window.scrollTo(0, 0);
                              setLoading(false);
                            }
                          });
                        }}
                      >
                        <div className="d-flex flex-column">
                          <span className="fw-semibold text-dark">
                            <i className="bi bi-file-earmark-text me-1 text-primary"></i> {r.denumire}
                          </span>
                          <span className="badge bg-light text-muted mt-1">
                            {new Date(r.data_adaugare).toLocaleString("ro-RO", {
                              timeZone: "UTC",
                              hour12: false,
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                        <button className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-download"></i> Încarcă
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white text-center text-muted py-3 border-top mt-auto">
        <p className="mb-0">© {new Date().getFullYear()} Generator Orare – Setare Reguli</p>
      </footer>
    </div>
    
  );
};

export default SetareReguli;
