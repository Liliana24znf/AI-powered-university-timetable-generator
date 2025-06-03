import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";

const Sali = () => {
  const [numarCursuri, setNumarCursuri] = useState(0);
const [numarLaboratoare, setNumarLaboratoare] = useState(0);
const [numarSeminare, setNumarSeminare] = useState(0);
const [numarProiecte, setNumarProiecte] = useState(0);
  
const [saliGenerat, setSaliGenerat] = useState([]);
  const [saliSelectate, setSaliSelectate] = useState([]);
  
  const [resetKey, setResetKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

const genereazaSali = async () => {
  setIsLoading(true);
  try {
    const response = await fetch("http://localhost:5000/toate_sali");
    const existente = await response.json();

    const genereazaCoduri = (prefix, tip, count, existente) => {
      const coduriExistente = existente
        .filter((s) => s.tip === tip && s.cod.startsWith(prefix))
        .map((s) => parseInt(s.cod.replace(prefix, "")))
        .sort((a, b) => a - b);

      const coduriNoi = [];
      let next = 1;
      while (coduriNoi.length < count) {
        if (!coduriExistente.includes(next)) {
          coduriNoi.push({ cod: `${prefix}${next}`, tip });
        }
        next++;
      }

      return coduriNoi;
    };

    const noi = [
      ...genereazaCoduri("GC", "Curs", numarCursuri, existente),
      ...genereazaCoduri("GL", "Laborator", numarLaboratoare, existente),
      ...genereazaCoduri("GS", "Seminar", numarSeminare, existente),
      ...genereazaCoduri("GP", "Proiect", numarProiecte, existente)

    ];

    if (noi.length === 0) {
      toast.info("Nu sunt săli noi de adăugat.");
      setIsLoading(false);
      return;
    }

    const saveResponse = await fetch("http://localhost:5000/adauga_sali", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noi),
    });

    const result = await saveResponse.json();
    if (result.success) {
      toast.success("✅ Sălile au fost salvate!");
      fetchSali();

      // Resetare câmpuri
      setNumarCursuri(0);
      setNumarLaboratoare(0);
      setNumarSeminare(0);
      setNumarProiecte(0);

    } else {
      toast.error("❌ " + result.error);
    }
  } catch (error) {
    toast.error("❌ Eroare la generare/trimite săli.");
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};




const fetchSali = async () => {
  try {
    const response = await fetch("http://localhost:5000/toate_sali");
    const data = await response.json();
    if (Array.isArray(data)) {
      setSaliSelectate([]);      // resetare selecții
      setNumarCursuri(0);
      setNumarLaboratoare(0);
      setNumarSeminare(0);
      setSaliGenerat(data);      // setare noi săli
      setResetKey(prev => prev + 1); // 🔄 forțare rerender
    }
  } catch (err) {
    console.error("Eroare la încărcare săli:", err);
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
  Generator Orare
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



      <div className="my-4" />
      {/* Conținut */}
<div className="row mb-4 flex-nowrap overflow-auto">

  {/* Curs */}
<div className="col-md-3" style={{ minWidth: "280px" }}>

    <div className="card border-start border-3 border-primary shadow-sm h-100">
      <div className="card-body">
        <h6 className="fw-bold text-primary mb-2">📘 Săli de Curs (GC)</h6>
        <input
          type="number"
          className="form-control"
          placeholder="ex: 3"
          min="0"
          value={numarCursuri}
          onChange={(e) => setNumarCursuri(parseInt(e.target.value) || 0)}
        />
      </div>
    </div>
  </div>

  {/* Laborator */}
<div className="col-md-3" style={{ minWidth: "280px" }}>

    <div className="card border-start border-3 border-success shadow-sm h-100">
      <div className="card-body">
        <h6 className="fw-bold text-success mb-2">🧪 Săli de Laborator (GL)</h6>
        <input
          type="number"
          className="form-control"
          placeholder="ex: 2"
          min="0"
          value={numarLaboratoare}
          onChange={(e) => setNumarLaboratoare(parseInt(e.target.value) || 0)}
        />
      </div>
    </div>
  </div>

  {/* Seminar */}
<div className="col-md-3" style={{ minWidth: "280px" }}>

    <div className="card border-start border-3 border-warning shadow-sm h-100">
      <div className="card-body">
        <h6 className="fw-bold text-warning mb-2">📝 Săli de Seminar (GS)</h6>
        <input
          type="number"
          className="form-control"
          placeholder="ex: 1"
          min="0"
          value={numarSeminare}
          onChange={(e) => setNumarSeminare(parseInt(e.target.value) || 0)}
        />
      </div>
    </div>
  </div>

{/* Proiect */}
<div className="col-md-3" style={{ minWidth: "280px" }}>

  <div className="card border-start border-3 border-info shadow-sm h-100">
    <div className="card-body">
      <h6 className="fw-bold text-info mb-2">💼 Săli de Proiect (GP)</h6>
      <input
        type="number"
        className="form-control"
        placeholder="ex: 2"
        min="0"
        value={numarProiecte}
        onChange={(e) => setNumarProiecte(parseInt(e.target.value) || 0)}
      />
    </div>
  </div>
</div>


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
  const culoare =
    tip === "Curs" ? "primary" :
    tip === "Laborator" ? "success" :
    tip === "Seminar" ? "warning" :
    tip === "Proiect" ? "info" :
    "info";
  const prefix =
    tip === "Curs" ? "GC" :
    tip === "Laborator" ? "GL" :
    tip === "Seminar" ? "GS" :
    tip === "Proiect" ? "GP" :
    "GP";

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
              {tip === "Curs" ? "📘 Săli de Curs (GC)" :
               tip === "Laborator" ? "🧪 Săli de Laborator (GL)" :
               tip === "Seminar" ? "📝 Săli de Seminar (GS)" :
               "💼 Săli de Proiect (GP)"}
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
                    checked={saliFiltrate.every((s) =>
                      saliSelectate.includes(s.cod)
                    )}
                    onChange={(e) =>
                      toggleSelectAllByTip(tip, e.target.checked)
                    }
                  />
                  <label className="form-check-label" htmlFor={`selectAll-${tip}`}>
                    Selectează toate
                  </label>
                </div>
                <p className="text-muted small mt-2">Total: {saliFiltrate.length} săli</p>

                <ul className="list-group">
                  {saliFiltrate.map((s, i) => (
                    <li
                      key={i}
                      className="list-group-item d-flex align-items-center"
                    >
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