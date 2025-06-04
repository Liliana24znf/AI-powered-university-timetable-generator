import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";



const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user"); // sau orice cheie folosești
    navigate("/"); // redirecționează către homepage
  };

const [user, setUser] = useState(null);

useEffect(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    setUser(JSON.parse(storedUser));
  }
}, []);


  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      {/* Navbar */}
<nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4">
  <div className="container-fluid d-flex justify-content-between align-items-center">
    <Link to="/" className="navbar-brand fw-bold fs-5 text-primary">
      Aplicație pentru planificare inteligentă utilizând tehnici de A.I.
    </Link>

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


      {/* Header */}
<div className="container my-5">
  <div className="row align-items-center">
    {/* Text pe stânga */}
    <div className="col-lg-6 col-md-12 text-start mb-4 mb-lg-0">
      <h2 className="fw-bold text-primary mb-3">
        Bine ați venit! 🧠📅
      </h2>
      <p className="text-secondary fs-5 mb-4">
        Organizează-ți timpul eficient, rapid și fără stres!
      </p>
      <ul className="list-unstyled text-muted small" style={{ lineHeight: "1.6" }}>

        <li className="mb-3">🛠️ Această aplicație vă permite să generați automat un orar complet și corect, adaptat după cerințele facultății.</li>
        <li className="mb-3">👥 Veți începe prin a introduce grupele și subgrupele studenților. Apoi, veți adăuga sălile disponibile pentru activități.</li>
        <li className="mb-3">👩‍🏫 În pasul următor, înregistrați profesorii împreună cu disciplinele predate și tipul de activitate (curs, seminar, laborator).</li>
        <li className="mb-3">⚙️ La final, setați regulile de generare – iar sistemul AI va crea automat orarul ideal.</li>
      </ul>
      <p className="mt-4 fw-semibold text-dark">
        ✨ Alegeți o secțiune mai jos sau începeți o generare nouă!
      </p>
    </div>

    {/* Imagine pe dreapta */}
    <div className="col-lg-6 col-md-12 text-center">
      <img
  src="/images/calendar-illustration.png"
  alt="Calendar AI"
  className="img-fluid rounded shadow-sm"
  style={{ maxWidth: "350px", height: "auto" }}
/>

    </div>
  </div>
</div>


      {/* Secțiuni */}
      <div className="container mb-5">
        <div className="row g-4">
          {/* Grupe */}
          <div className="col-md-6" >
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title text-primary">
                  <i className="bi bi-people-fill me-2"></i>Gestionare Grupe
                </h5>
                <p className="card-text text-muted">
                  Introduceți grupele și subgrupele pentru fiecare an de studiu. Grupele sunt esențiale pentru împărțirea corectă a activităților în orar.
                </p>
                <Link to="/grupe" className="btn btn-outline-primary">
                  Mergi la Grupe
                </Link>
              </div>
            </div>
          </div>

          {/* Săli */}
          <div className="col-md-6" >
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title text-success">
                  <i className="bi bi-door-open-fill me-2"></i>Gestionare Săli
                </h5>
                <p className="card-text text-muted">
                  Introduceți sălile disponibile pentru cursuri, laboratoare și seminare. Sistemul va evita suprapunerile între săli.
                </p>
                <Link to="/sali" className="btn btn-outline-success">
                  Mergi la Săli
                </Link>
              </div>
            </div>
          </div>

          {/* Profesori */}
          <div className="col-md-6" >
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title text-warning">
                  <i className="bi bi-person-video2 me-2"></i>Gestionare Profesori
                </h5>
                <p className="card-text text-muted">
                  Adăugați profesorii, disciplinele predate și tipurile de activități (curs, laborator, seminar). Se pot adăuga mai multe activități per profesor.
                </p>
                <Link to="/profesori" className="btn btn-outline-warning">
                  Mergi la Profesori
                </Link>
              </div>
            </div>
          </div>

          {/* Reguli */}
          <div className="col-md-6" >
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title text-info">
                  <i className="bi bi-sliders2 me-2"></i>Reguli de Generare
                </h5>
                <p className="card-text text-muted">
                  Definește reguli personalizate pentru generarea orarului (ex: pauze, intervale orare, cerințe speciale, priorități).
                </p>
                <Link to="/reguli" className="btn btn-outline-info">
                  Mergi la Reguli
                </Link>
              </div>
            </div>
          </div>
        </div>

<div className="text-center mt-5">
  <h4 className="mb-4 fw-semibold text-dark">
    Doriți să începeți o generare nouă a orarului?
  </h4>

  <Link
    to="/grupe"
    onClick={() => window.scrollTo(0, 0)}
    className="btn btn-success btn-lg px-5 py-3 shadow rounded-pill d-inline-flex align-items-center gap-2"
    style={{ fontSize: "1.1rem" }}
  >
    <i className="bi bi-plus-circle fs-5"></i>
    Începe Generare Nouă
  </Link>
</div>

      </div>

      {/* Footer */}
      <footer className="bg-white text-center py-4 border-top mt-auto">
        <p className="mb-0 text-muted">
          © 2025 Generator AI Orare – Toate drepturile rezervate.
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
