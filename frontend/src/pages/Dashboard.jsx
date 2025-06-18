import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import useDashboardLogic from "../functiiLogice/useDashboardLogic";
import usePreventBack from "../functiiLogice/usePreventBack";
import useScrollToTop from "../functiiLogice/useScrollToTop";


const Dashboard = () => {
  const { user, handleLogout } = useDashboardLogic();

usePreventBack();
  useScrollToTop();
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
          <div className="col-lg-6 col-md-12 text-start mb-4 mb-lg-0">
            <h2 className="fw-bold text-primary mb-3">Bine ați venit! 🧠📅</h2>
            <p className="text-secondary fs-5 mb-4">
              Organizează-ți timpul eficient, rapid și fără stres!
            </p>
            <ul className="list-unstyled text-muted small" style={{ lineHeight: "1.6" }}>
              <li className="mb-3">🛠️ Generare automată a unui orar complet și corect.</li>
              <li className="mb-3">👥 Introducerea grupelor și subgrupelor studenților.</li>
              <li className="mb-3">👩‍🏫 Adăugarea profesorilor și activităților asociate.</li>
              <li className="mb-3">⚙️ Definirea regulilor de generare și lansarea orarului.</li>
            </ul>
            <p className="mt-4 fw-semibold text-dark">
              ✨ Alegeți o secțiune mai jos sau începeți o generare nouă!
            </p>
          </div>
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
          <SectiuneCard
            icon="bi-people-fill"
            culoare="primary"
            titlu="Gestionare Grupe"
            descriere="Introduceți grupele și subgrupele pentru fiecare an de studiu."
            link="/grupe"
            onClick={() => window.scrollTo(0, 0)}
          className="btn btn-primary btn-lg rounded-pill px-5"
            btn="Mergi la Grupe"
          />
          {/* Săli */}
          <SectiuneCard
            icon="bi-door-open-fill"
            culoare="success"
            titlu="Gestionare Săli"
            descriere="Introduceți sălile disponibile pentru activități fără suprapuneri."
            link="/sali"
            btn="Mergi la Săli"
          />
          {/* Profesori */}
          <SectiuneCard
            icon="bi-person-video2"
            culoare="warning"
            titlu="Gestionare Profesori"
            descriere="Adăugați profesorii, disciplinele și tipurile de activități."
            link="/profesori"
            btn="Mergi la Profesori"
          />
          {/* Reguli */}
          <SectiuneCard
            icon="bi-sliders2"
            culoare="info"
            titlu="Reguli de Generare"
            descriere="Definește reguli personalizate pentru generarea orarului."
            link="/setare-reguli"
            btn="Mergi la Reguli"
          />

        </div>

        <div className="col-12 mt-4"> 
  <div className="card border-info shadow-sm text-center py-3 px-4">
    <div className="d-flex align-items-center justify-content-center flex-wrap gap-3">
      <h5 className="fw-bold mb-0 text-info">
        <i className="bi bi-sliders2 me-2"></i>
        Generare Orar:
      </h5>
      <span className="text-muted">
        🔒 Pentru a putea genera un orar, asigură-te că toate secțiunile sunt completate:
      </span>
      <div className="d-flex flex-wrap align-items-center gap-3 ms-3">
        <span className="text-success"><i className="bi bi-check-square-fill me-1"></i> Grupe</span>
        <span className="text-success"><i className="bi bi-check-square-fill me-1"></i> Săli</span>
        <span className="text-success"><i className="bi bi-check-square-fill me-1"></i> Profesori</span>
        <span className="text-success"><i className="bi bi-check-square-fill me-1"></i> Reguli</span>
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

// Componentă reutilizabilă pentru carduri de secțiune
const SectiuneCard = ({ icon, culoare, titlu, descriere, link, btn }) => (
  <div className="col-md-6">
    <div className="card shadow-sm h-100">
      <div className="card-body">
        <h5 className={`card-title text-${culoare}`}>
          <i className={`bi ${icon} me-2`}></i>{titlu}
        </h5>
        <p className="card-text text-muted">{descriere}</p>
        <Link to={link} className={`btn btn-outline-${culoare}`}>
          {btn}
        </Link>
      </div>
    </div>
  </div>
);

export default Dashboard;
