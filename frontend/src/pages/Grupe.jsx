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
  const [editSectiune, setEditSectiune] = useState(null);
  const [grupaNoua, setGrupaNoua] = useState("");

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
    const existente = new Set(grupeGenerat.map((gr) => gr.denumire));
    const noiGrupe = [];

    for (let g = 1; g <= nrGrupe; g++) {
      for (let s = 0; s < nrSubgrupe; s++) {
        const subgrupa = String.fromCharCode(97 + s);
        const denumire = `${nivel[0]}${an}${g}${subgrupa}`;

        if (!existente.has(denumire)) {
          noiGrupe.push({ nivel, an, grupa: g.toString(), subgrupa, denumire });
        }
      }
    }

    if (noiGrupe.length === 0) {
      toast.info("ℹ️ Nu sunt grupe noi de adăugat.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/adauga_grupe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noiGrupe),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("✅ Grupele noi au fost salvate!");
        fetchGrupe();
      } else toast.error("❌ " + result.error);
    } catch (err) {
      toast.error("❌ Eroare la salvare grupe.");
    }
  };

  const adaugaGrupaIndividuala = async () => {
    const match = grupaNoua.match(/^(\d+)([a-z])$/i);
    if (!match) return toast.error("Format invalid. Exemplu corect: 2b");

    const grupa = match[1];
    const subgrupa = match[2];
    const denumire = `${editSectiune.nivel[0]}${editSectiune.an}${grupa}${subgrupa}`;

    if (grupeGenerat.find((g) => g.denumire === denumire)) {
      return toast.info("ℹ️ Grupa există deja.");
    }

    try {
      const res = await fetch("http://localhost:5000/adauga_grupe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            nivel: editSectiune.nivel,
            an: editSectiune.an,
            grupa,
            subgrupa,
            denumire,
          },
        ]),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("✅ Grupa a fost adăugată.");
        setGrupaNoua("");
        fetchGrupe();
      } else toast.error("❌ " + result.error);
    } catch (err) {
      toast.error("❌ Eroare la adăugare grupă.");
    }
  };

  const stergeGrupa = async (denumire) => {
    const confirm = await Swal.fire({
      title: "Ștergere grupă?",
      text: `Grupa ${denumire} va fi ștearsă.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Da, șterge!",
      cancelButtonText: "Anulează",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch("http://localhost:5000/sterge_grupe_selectate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coduri: [denumire] }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`✅ Grupa ${denumire} a fost ștearsă.`);
        fetchGrupe();
      } else toast.error("❌ " + result.error);
    } catch {
      toast.error("❌ Eroare la conexiune.");
    }
  };

  const toggleSelect = (cod) => {
    setGrupeSelectate((prev) =>
      prev.includes(cod) ? prev.filter((c) => c !== cod) : [...prev, cod]
    );
  };

  const stergeSelectie = async () => {
    if (grupeSelectate.length === 0)
      return toast.info("Selectează cel puțin o grupă.");
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

  const grupePeNivelSiAn = () => {
    const grupate = {};
    grupeGenerat.forEach((gr) => {
      const cheie = `${gr.nivel} - Anul ${gr.an}`;
      if (!grupate[cheie]) grupate[cheie] = [];
      grupate[cheie].push(gr);
    });
    const ordineaAni = { I: 1, II: 2, III: 3, IV: 4 };
    const ordineaNivele = { Licenta: 1, Master: 2 };
    const cheiSortate = Object.keys(grupate).sort((a, b) => {
      const [nivelA, anA] = a.split(" - Anul ");
      const [nivelB, anB] = b.split(" - Anul ");
      return (
        ordineaNivele[nivelA] - ordineaNivele[nivelB] ||
        ordineaAni[anA] - ordineaAni[anB]
      );
    });

    return cheiSortate.map((cheie) => {
      const grupeSortate = grupate[cheie].sort((a, b) => {
        const gA = parseInt(a.grupa);
        const gB = parseInt(b.grupa);
        if (gA !== gB) return gA - gB;
        return a.subgrupa.localeCompare(b.subgrupa);
      });
      return { titlu: cheie, grupe: grupeSortate };
    });
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
            <button className="btn btn-outline-primary me-2" onClick={fetchGrupe}>🔄 Reîncarcă</button>
            <button className="btn btn-primary" onClick={() => navigate("/sali")}>➡ Continuă</button>
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
              <input type="number" min="1" className="form-control" value={nrGrupe} onChange={(e) => setNrGrupe(parseInt(e.target.value) || 1)} />
            </div>
            <div className="mb-3">
              <label className="form-label">Număr Subgrupe / grupă:</label>
              <input type="number" min="1" className="form-control" value={nrSubgrupe} onChange={(e) => setNrSubgrupe(parseInt(e.target.value) || 1)} />
            </div>
            <button className="btn btn-success w-100" onClick={genereazaGrupe}>✅ Generează Grupe</button>
          </div>
        </div>

        <div className="col-md-7 mb-4">
          <div className="card p-4 shadow-sm">
            <h5 className="mb-3">📋 Grupe existente:</h5>
            {grupeGenerat.length === 0 ? (
              <p className="text-muted">Nu există grupe adăugate încă.</p>
            ) : (
              grupePeNivelSiAn().map((sectiune, idx) => (
                <div key={idx} className="mb-4">
                  <h6 className="fw-bold mb-2 text-primary d-flex justify-content-between align-items-center">
                    {sectiune.titlu}
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        setEditSectiune({
                          nivel: sectiune.titlu.split(' - ')[0],
                          an: sectiune.titlu.split(' - ')[1].replace('Anul ', '')
                        })
                      }
                    >
                      ✏️ Editează
                    </button>
                  </h6>
                  <ul className="list-group">
                    {sectiune.grupe.map((gr, i) => (
                      <li key={i} className="list-group-item d-flex align-items-center">
                        <input
                          type="checkbox"
                          className="form-check-input me-2"
                          checked={grupeSelectate.includes(gr.denumire)}
                          onChange={() => toggleSelect(gr.denumire)}
                        />
                        <div className="d-flex flex-column">
                          <span className="fw-bold text-dark">🧑‍🎓 {gr.denumire}</span>
                          <div className="small text-muted">
                            <span className="badge bg-primary me-1">{gr.nivel}</span>
                            <span className="badge bg-secondary me-1">An {gr.an}</span>
                            <span className="badge bg-success me-1">Grupa {gr.grupa}</span>
                            {gr.subgrupa && <span className="badge bg-info">Subgrupa {gr.subgrupa}</span>}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-danger ms-auto"
                          onClick={() => stergeGrupa(gr.denumire)}
                        >
                          🗑️
                        </button>
                      </li>
                    ))}
                  </ul>
                  {editSectiune &&
                    editSectiune.nivel === sectiune.titlu.split(' - ')[0] &&
                    editSectiune.an === sectiune.titlu.split(' - ')[1].replace('Anul ', '') && (
                      <div className="card p-3 mt-3 bg-light">
                        <h6 className="mb-3">➕ Adaugă grupă/subgrupă la {editSectiune.nivel} - Anul {editSectiune.an}</h6>
                        <div className="input-group mb-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ex: 2b"
                            value={grupaNoua}
                            onChange={(e) => setGrupaNoua(e.target.value)}
                          />
                          <button className="btn btn-success" onClick={adaugaGrupaIndividuala}>Adaugă</button>
                          <button className="btn btn-secondary" onClick={() => { setEditSectiune(null); setGrupaNoua(""); }}>Anulează</button>
                        </div>
                      </div>
                    )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {grupeGenerat.length > 0 && (
        <div className="text-end mt-3">
          <button className="btn btn-danger" onClick={stergeSelectie}>🗑️ Șterge selecția</button>
        </div>
      )}

      <footer className="bg-light text-center py-4 mt-auto">
        <p className="mb-0">© {new Date().getFullYear()} Generator Orare. Toate drepturile rezervate.</p>
      </footer>
    </div>
  );
};

export default Grupe;
