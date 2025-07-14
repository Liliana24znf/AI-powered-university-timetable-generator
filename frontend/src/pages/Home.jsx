import React from "react";

import { Link } from "react-router-dom";
import useHomeLogic from "../functiiLogice/dashboard/useHomeLogic";
import "bootstrap/dist/css/bootstrap.min.css";
import usePreventBack from "../functiiLogice/utils/usePreventBack";
import useScrollToTop from "../functiiLogice/utils/useScrollToTop";

const Home = () => {
  const { user, handleLogout } = useHomeLogic();
  usePreventBack();
  useScrollToTop();

  return (
    <div style={{ minBlockSize: "100vh", inlineSize: "100%", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 w-100">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <Link to="/" className="navbar-brand fw-bold fs-5 text-primary">
            Aplicație pentru planificare inteligentă utilizând tehnici de AI
          </Link>
          <div className="ms-auto">
            {user ? (
              <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-2">
                <span className="fw-semibold text-primary">
                  👋 Bine ai revenit, {user.nume || user.username}!
                </span>
                <Link to="/dashboard" className="btn btn-outline-success">
                  Generează orarul
                </Link>
                <button className="btn btn-outline-danger" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-outline-primary">
                Autentificare
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
<section className="hero py-5 bg-light">
  <div className="container">
    <div className="row align-items-center">
      
      {/* Text Left */}
      <div className="col-lg-6 mb-4 mb-lg-0 text-center text-lg-start">
        <h1 className="fw-bold display-5 text-dark mb-3">
          Planificare inteligentă a orarului<br />
          cu ajutorul <span className="text-primary">Inteligenței Artificiale</span>
        </h1>
        <p className="lead text-muted mb-4">
          O platformă inovatoare pentru generarea automată a orarelor universitare – 
          bazată pe algoritmi avansați și reguli complet personalizabile.
        </p>

        {user ? (
          <Link
            to="/dashboard"
            className="btn btn-success btn-lg rounded-pill px-5 shadow-sm"
          >
            Accesează aplicația
          </Link>
        ) : (
          <Link
            to="/login"
            className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm"
          >
            Autentifică-te
          </Link>
        )}
      </div>

      {/* Image Right */}
      <div className="col-lg-6 text-center">
        <div
          className="p-3 bg-white rounded-4 shadow d-inline-block border"
          style={{ maxWidth: "100%" }}
        >
          <img
            src="/images/hero-timetable.png"
            alt="Vizualizare orar generat automat"
            className="img-fluid rounded-4"
            style={{ maxHeight: "360px", objectFit: "contain" }}
          />
        </div>
      </div>
    </div>
  </div>
</section>


      {/* Cum funcționează */}
      <section className="container py-5">
        <h2 className="text-center fw-bold mb-5">Cum funcționează platforma?</h2>
        <div className="row g-4 justify-content-center">
          {[
            {
              img: "/images/add-data.png",
              title: "1. Introduceți datele",
              desc: "Completați lista profesorilor, sălilor, disciplinelor și grupelor — manual sau prin formular. Toate informațiile sunt salvate în baza de date."
            },
            {
              img: "/images/set-rules.png",
              title: "2. Stabiliți regulile",
              desc: "Configurați intervalele orare, restricțiile și preferințele (ex: zile libere, pauze, tipuri de activități), direct din interfață."
            },
            {
              img: "/images/generate-schedule.png",
              title: "3. Generează orarul",
              desc: "Printr-un model AI (GPT-4o) sau algoritm propriu, aplicația generează un orar complet pentru fiecare an, grupă și subgrupă — fără suprapuneri."
            },
            {
              img: "/images/edit-schedule.png",
              title: "4. Vizualizați și exportați",
              desc: "Previzualizați orarul generat, exportați-l în PDF/Excel, sau ajustați datele și regenerați. Orarul respectă exact datele introduse."
            }
          ].map((item) => (
            <div key={item.title} className="col-sm-6 col-md-3 text-center">
              <img src={item.img} alt={item.title} className="img-fluid mb-3" style={{ inlineSize: "100%", objectFit: "contain" }} />
              <h5 className="fw-semibold">{item.title}</h5>
              <p className="text-muted small">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Caracteristici */}
      <section className="container py-1">
        <h2 className="text-center fw-bold mb-5">Caracteristici principale</h2>
        <div className="row g-4">
          {[
            {
              icon: "👩‍🏫🏫",
              title: "Gestionare completă a datelor",
              desc: "Introduceți profesori, discipline, săli și grupe direct din interfață. Datele sunt salvate într-o bază de date relațională."
            },
            {
              icon: "⚙️",
              title: "Setare flexibilă a regulilor",
              desc: "Stabiliți constrângeri personalizate pentru orar: ore permise, pauze, săli disponibile, restricții de zi/oră etc."
            },
            {
              icon: "🤖",
              title: "Generare automată cu AI",
              desc: "Folosiți GPT sau un algoritm propriu pentru a genera orare complete și coerente, fără conflicte."
            },
            {
              icon: "📊",
              title: "Raport de validare",
              desc: "După generare, sistemul oferă un raport cu eventualele conflicte și sincronizări lipsă între grupe."
            },
            {
              icon: "📚",
              title: "Vizualizare pe grupe și profesori",
              desc: "Orarul este afișat pe ani, grupe și subgrupe."
            },
            {
              icon: "📤",
              title: "Export PDF și Excel",
              desc: "Orarul generat poate fi descărcat în format PDF sau Excel, pregătit pentru avizier sau distribuire."
            },
            {
              icon: "🔄",
              title: "Regenerare instantă",
              desc: "Modificați datele sau regulile și regenerați imediat o nouă variantă de orar complet."
            },
            {
              icon: "✅",
              title: "Respectarea datelor introduse",
              desc: "Orarul este generat exclusiv pe baza datelor reale introduse: fără completări automate sau inventate."
            },
            {
              icon: "🧠",
              title: "Reguli GPT personalizabile",
              desc: "Utilizatorul poate defini reguli proprii de generare, transmise direct către AI pentru rezultate precise."
            }
          ].map((item) => (
            <div key={item.title} className="col-md-4">
              <div className="border rounded-4 shadow-sm h-100 p-4">
                <h5>{item.icon} {item.title}</h5>
                <p className="text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Buton final */}
      <div className="text-center mt-4">
       {user ? (
  <>
    <Link
      to="/dashboard"
      onClick={() => window.scrollTo(0, 0)}
      className="btn btn-primary btn-lg rounded-pill px-5"
    >
      🚀 Începe generarea orarului
    </Link>
    <p className="text-muted mt-2" style={{ fontSize: "0.95rem" }}>
      Vei fi redirecționat către platforma unde poți seta reguli, selecta datele și lansa generarea orarului complet.
    </p>
  </>
) : (
  <>
    <button
      className="btn btn-secondary btn-lg rounded-pill px-5"
      disabled
      style={{ cursor: "not-allowed", opacity: 0.7 }}
    >
      🚀 Începe generarea orarului
    </button>
    <p className="text-muted mt-2" style={{ fontSize: "0.95rem" }}>
      Autentifică-te pentru a accesa funcționalitatea de generare a orarului.
    </p>
  </>
)}

      </div>
      
      <footer className="text-center py-4 bg-light mt-5">
        <p className="mb-0">&copy; 2025 Generator Orare. Toate drepturile rezervate.</p>
      </footer>
    </div>
  );
};

export default Home;