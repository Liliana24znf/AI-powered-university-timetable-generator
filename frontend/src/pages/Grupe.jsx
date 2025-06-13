
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const getSubgrupaLitera = (index) => String.fromCharCode("a".charCodeAt(0) + index);

const fetchGrupe = async (silent = false) => {
  setIsLoading(true);
  setGrupeSelectate([]);
  try {
    const res = await fetch("http://localhost:5000/toate_grupe");
    const data = await res.json();
    if (Array.isArray(data)) {
      setGrupeGenerat(data);
    }
  } catch {
    toast.error("❌ Eroare la încărcarea grupelor.");
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchGrupe();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (editSectiune) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editSectiune]);



  
const genereazaGrupe = async () => {
  const existente = new Set(grupeGenerat.map((gr) => gr.denumire));
  const noiGrupe = [];

  for (let g = 1; g <= nrGrupe; g++) {
    for (let s = 0; s < nrSubgrupe; s++) {
      const subgrupa = getSubgrupaLitera(s);
      const denumire = `${nivel[0]}${an}${g}${subgrupa}`;
      if (!existente.has(denumire)) {
        noiGrupe.push({ nivel, an, grupa: g.toString(), subgrupa, denumire });
      }
    }
  }

  if (!noiGrupe.length) return toast.info("ℹ️ Nu sunt grupe noi de adăugat.");

  try {
    const res = await fetch("http://localhost:5000/adauga_grupe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noiGrupe),
    });
    const result = await res.json();
    if (result.success) {
      toast.success("✅ Grupele au fost salvate.");
      fetchGrupe();

      // 🧹 Resetare formular
      setNivel("Licenta");
      setAn("I");
      setNrGrupe(1);
      setNrSubgrupe(1);
    } else toast.error("❌ " + result.error);
  } catch {
    toast.error("❌ Eroare la salvare grupe.");
  }
};


  const adaugaGrupaIndividuala = async () => {
    const match = grupaNoua.trim().match(/^(\d{1,2})([a-zA-Z])$/);
    if (!match) return toast.error("⚠️ Format invalid. Exemplu corect: 2b sau 10A");

    const [, grupaRaw, subgrupaRaw] = match;
    const grupa = grupaRaw.replace(/^0+/, "");
    const subgrupa = subgrupaRaw.toLowerCase();
    const denumire = `${editSectiune.nivel[0]}${editSectiune.an}${grupa}${subgrupa}`;

    if (grupeGenerat.find((g) => g.denumire === denumire)) {
      return toast.info("ℹ️ Grupa există deja.");
    }

    try {
      const res = await fetch("http://localhost:5000/adauga_grupe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ nivel: editSectiune.nivel, an: editSectiune.an, grupa, subgrupa, denumire }]),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("✅ Grupa a fost adăugată.");
        setGrupaNoua("");
        setEditSectiune(null);
        fetchGrupe();
      } else toast.error("❌ " + result.error);
    } catch {
      toast.error("❌ Eroare la adăugare.");
    }
  };

  const stergeGrupa = async (cod) => {
    const confirm = await Swal.fire({
      title: "Ștergere grupă?",
      text: `Grupa ${cod} va fi ștearsă.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Da, șterge!",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch("http://localhost:5000/sterge_grupe_selectate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coduri: [cod] }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`✅ Grupa ${cod} a fost ștearsă.`);
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
    if (!grupeSelectate.length) return toast.info("ℹ️ Selectează cel puțin o grupă.");
    const confirm = await Swal.fire({
      title: "Ștergere selecție?",
      text: "Grupele selectate vor fi șterse.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Da, șterge!",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch("http://localhost:5000/sterge_grupe_selectate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coduri: grupeSelectate }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("✅ Grupele selectate au fost șterse.");
        setGrupeSelectate([]);
        fetchGrupe();
      } else toast.error("❌ " + result.error);
    } catch {
      toast.error("❌ Eroare la ștergere.");
    }
  };

  const grupePeNivelSiAn = () => {
    const grupate = {};
    grupeGenerat
      .filter((gr) => gr.denumire.toLowerCase().includes(searchTerm.toLowerCase()))
      .forEach((gr) => {
        const cheie = `${gr.nivel} - Anul ${gr.an}`;
        if (!grupate[cheie]) grupate[cheie] = [];
        grupate[cheie].push(gr);
      });

    const ordineaAni = { I: 1, II: 2, III: 3, IV: 4 };
    const ordineaNivele = { Licenta: 1, Master: 2 };

    return Object.entries(grupate)
      .sort(([a], [b]) => {
        const [nivelA, anA] = a.split(" - Anul ");
        const [nivelB, anB] = b.split(" - Anul ");
        return ordineaNivele[nivelA] - ordineaNivele[nivelB] || ordineaAni[anA] - ordineaAni[anB];
      })
      .map(([cheie, grupe]) => ({
        titlu: cheie,
        grupe: grupe.sort((a, b) =>
          parseInt(a.grupa) - parseInt(b.grupa) || a.subgrupa.localeCompare(b.subgrupa)
        ),
      }));
  };




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
      text: "Datele nesalvate despre grupe vor fi pierdute. Ești sigur că vrei să revii la pagina anterioară?",
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
  <span className="fs-6 m-0 d-flex flex-column align-items-start justify-content-center text-decoration-none">utilizând tehnici de A.I.</span>
</button>

          <span className="text-primary fw-bold fs-4">👥 Gestionare Grupe</span>
          <div className="position-absolute end-0 d-flex gap-2">
            <button
    className="btn btn-outline-danger"
    onClick={() => {
      Swal.fire({
        title: "Revenire la început?",
        text: "Datele nesalvate despre grupe vor fi pierdute. Ești sigur că vrei să revii?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Da, revin",
        cancelButtonText: "Rămân aici",
      }).then((result) => {
        if (result.isConfirmed) navigate("/dashboard");
      });
    }}
  >
    🔙 Înapoi
  </button>

  <button
    className="btn btn-outline-secondary"
    onClick={() => {
      Swal.fire({
        title: "Reîncarcă grupele?",
        text: "Grupele actuale vor fi reîncărcate din baza de date. Modificările nesalvate vor fi pierdute.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Da, reîncarcă",
        cancelButtonText: "Nu",
      }).then((result) => {
        if (result.isConfirmed) fetchGrupe();
      });
    }}
  >
    🔄 Reîncarcă
  </button>

  <button
    className="btn btn-outline-primary"
    onClick={() => {
      Swal.fire({
        title: "Continui către săli?",
        text: "Asigură-te că ai salvat toate grupele înainte de a continua.",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Da, continuă",
        cancelButtonText: "Rămân aici",
      }).then((result) => {
        if (result.isConfirmed) navigate("/sali");
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
      <h4 className="fw-bold text-primary mb-3">ℹ️ Despre gestionarea grupelor</h4>
      <p className="text-secondary mb-2">
        În această secțiune poți <strong>configura manual grupele și subgrupele</strong> pentru fiecare an de studiu, atât pentru <strong>Licență</strong>, cât și pentru <strong>Master</strong>.
      </p>
      <p className="text-secondary mb-2">
        Ai posibilitatea de a <strong>adăuga grupe în bloc</strong> sau <strong>individual</strong>, de a le <strong>edita</strong>, <strong>șterge</strong> sau <strong>selecta</strong> pentru modificări ulterioare.
      </p>
      <p className="text-secondary">
        Toate grupele definite aici vor fi utilizate ulterior în procesul de <strong>generare automată a orarului</strong>.
      </p>
    </div>
  </div>
</div>


      <div className="row justify-content-center gx-5 mb-5">
  {/* Formular configurare grupe */}
  <div className="col-md-4">
    <div className="card border-0 shadow rounded-4 p-4 bg-white">
      <h4 className="mb-4 text-primary fw-bold text-center">⚙️ Configurare Grupe</h4>

      <div className="mb-3">
        <label htmlFor="nivelSelect" className="form-label fw-semibold">Nivel:</label>
        <select
          id="nivelSelect"
          className="form-select rounded-3"
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
        >
          <option value="Licenta">Licență</option>
          <option value="Master">Master</option>
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor="anSelect" className="form-label fw-semibold">An:</label>
        <select
          id="anSelect"
          className="form-select rounded-3"
          value={an}
          onChange={(e) => setAn(e.target.value)}
        >
          <option value="I">I</option>
          <option value="II">II</option>
          <option value="III">III</option>
          <option value="IV">IV</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">Număr Grupe:</label>
        <input type="number" className="form-control rounded-3" min="1" value={nrGrupe} onChange={(e) => setNrGrupe(parseInt(e.target.value) || 1)} />
      </div>

      <div className="mb-4">
        <label className="form-label fw-semibold">Subgrupe / Grupa:</label>
        <input type="number" className="form-control rounded-3" min="1" value={nrSubgrupe} onChange={(e) => setNrSubgrupe(parseInt(e.target.value) || 1)} />
      </div>

      <button className="btn btn-primary w-100 rounded-3 fw-bold" onClick={genereazaGrupe}>
  ✅ Generează Grupe
</button>

    </div>
  </div>

  {/* Afișare grupe existente */}
  <div className="col-md-7">
    <div className="card border-0 shadow rounded-4 p-4 bg-white">
      <h5 className="mb-4 text-primary fw-bold">📋 Grupe existente</h5>

      <div className="mb-3">
        <input
          type="text"
          className="form-control rounded-3"
          placeholder="🔍 Caută după denumire (ex: L1a, M2b)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" />
        </div>
      ) : grupeGenerat.length === 0 ? (
        <div className="text-center text-muted">
  <i className="bi bi-folder-x fs-1 d-block mb-2"></i>
  <span>Nu există grupe înregistrate momentan.</span>
</div>

     ) : grupePeNivelSiAn().length === 0 ? (
  <div className="text-center text-secondary py-5">
    <i className="bi bi-emoji-frown fs-1 text-warning mb-3 d-block"></i>
    <h5 className="fw-bold">Nicio grupă găsită</h5>
    <p className="mb-0">Verifică dacă ai introdus corect denumirea sau încearcă alt termen.</p>
  </div>
) : (
grupePeNivelSiAn().map((sectiune) => {
  const esteInEditare =
    editSectiune &&
    editSectiune.nivel === sectiune.titlu.split(' - ')[0] &&
    editSectiune.an === sectiune.titlu.split(' - ')[1].replace('Anul ', '');

  // Extracted ternary operation for button label
  const toateSelectate = sectiune.grupe.every((gr) => grupeSelectate.includes(gr.denumire));
  const selectAllButtonLabel = toateSelectate
    ? "❌ Deselectează toate"
    : "✅ Selectează toate";

  return (
    <div key={sectiune.titlu} className="mb-4">
      <h6 className="fw-bold d-flex justify-content-between align-items-center text-secondary">
        {sectiune.titlu}
        <div>
          <button
            className="btn btn-sm btn-outline-secondary me-2 rounded-3"
            onClick={() =>
              setEditSectiune({
                nivel: sectiune.titlu.split(' - ')[0],
                an: sectiune.titlu.split(' - ')[1].replace('Anul ', ''),
              })
            }
          >
            ✏️ Editează
          </button>
          <button
            className="btn btn-sm btn-outline-primary rounded-3"
            onClick={() => {
              if (toateSelectate) {
                setGrupeSelectate((prev) =>
                  prev.filter((cod) => !sectiune.grupe.some((gr) => gr.denumire === cod))
                );
              } else {
                setGrupeSelectate((prev) => [
                  ...prev,
                  ...sectiune.grupe
                    .map((gr) => gr.denumire)
                    .filter((cod) => !prev.includes(cod)),
                ]);
              }
            }}
          >
            {selectAllButtonLabel}
          </button>
        </div>
      </h6>
      <ul className="list-group">
        {sectiune.grupe.map((gr) => (
          <li key={gr.denumire} className="list-group-item d-flex align-items-center border-0 border-bottom py-2">
            <input
              type="checkbox"
              className="form-check-input me-3"
              checked={grupeSelectate.includes(gr.denumire)}
              onChange={() => toggleSelect(gr.denumire)}
            />
            <div className="d-flex flex-column">
              <span className="fw-bold text-dark">🧑‍🎓 {gr.denumire}</span>
              <div className="small text-muted">
                <span className="badge bg-primary me-1">{gr.nivel}</span>
                <span className="badge bg-secondary me-1">An {gr.an}</span>
                <span className="badge bg-success me-1">Grupa {gr.grupa}</span>
                {gr.subgrupa && (
                  <span className="badge bg-info text-dark">Subgrupa {gr.subgrupa}</span>
                )}
              </div>
            </div>
            <button
              className="btn btn-sm btn-outline-danger ms-auto rounded-3"
              onClick={() => stergeGrupa(gr.denumire)}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>

      {esteInEditare && (
        <div className="card bg-light p-3 mt-3 border-0 rounded-3">
          <h6 className="fw-bold mb-3">➕ Adaugă o grupă nouă (ex: 2b)</h6>
          <div className="input-group">
            <input
              className="form-control"
              value={grupaNoua}
              onChange={(e) => setGrupaNoua(e.target.value)}
              placeholder="ex: 2b"
            />
            <button className="btn btn-success" onClick={adaugaGrupaIndividuala}>
              Adaugă
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setEditSectiune(null);
                setGrupaNoua("");
              }}
            >
              Anulează
            </button>
          </div>
        </div>
      )}
    </div>
  );
})
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