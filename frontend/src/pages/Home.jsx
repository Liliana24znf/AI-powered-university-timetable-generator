import React, { useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Home = () => {
  const [orar, setOrar] = useState(null);
  const [loading, setLoading] = useState(false);

  const genereazaOrar = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/genereaza_orar");
      const data = await response.json();
      setOrar(data);
    } catch (err) {
      console.error("Eroare la generare:", err);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand fw-bold fs-4 text-primary">Generator Orare</Link>
          <div className="ms-auto">
            <Link to="/login" className="btn btn-outline-primary">Autentificare</Link>
          </div>
        </div>
      </nav>

      <section className="hero py-5 ">
        <div className="container">
          <div className="row align-items-center">

            <div className="col-lg-6 text-center text-lg-start mb-4 mb-lg-0">
              <h1 className="fw-bold display-5">
                Creează orarul perfect<br />în doar câteva minute
              </h1>
              <p className="lead text-muted mt-3">
                Generator Orare folosește inteligență artificială pentru a automatiza complet procesul de creare a orarului.
                Economisește timp, evită conflictele și oferă flexibilitate totală.
              </p>
              <Link to="/login" className="btn btn-primary btn-lg mt-3 rounded-pill px-4">
                Autentifică-te
              </Link>
            </div>

            <div className="col-lg-6 text-center">
              <div
                className="p-3 bg-white rounded-4 shadow-lg d-inline-block"
                style={{ maxWidth: "100%", border: "1px solid #e0e0e0" }}
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

      <section className="container-fluid py-5" style={{ maxWidth: "100%", padding: "0 5%" }}>
  <h2 className="text-center fw-bold">Cum funcționează?</h2>
  <div className="row mt-4 justify-content-center">
    
    <div className="col-md-3 text-center">
      <img src="/images/add-data.png" alt="Adăugați date" className="img-fluid mb-3" style={{ maxWidth: "100%", objectFit: "contain" }} />
      <h5>1. Adăugați datele</h5>
      <p className="text-muted">Introduceți rapid informații despre clase, materii, profesori și săli — manual sau prin fișiere Excel.</p>
    </div>

    <div className="col-md-3 text-center">
      <img src="/images/set-rules.png" alt="Setați reguli" className="img-fluid mb-3" style={{ maxWidth: "100%", objectFit: "contain" }} />
      <h5>2. Setați regulile</h5>
      <p className="text-muted">Definește constrângeri și preferințe: intervale orare, disponibilitate profesori și alte condiții specifice.</p>
    </div>

    <div className="col-md-3 text-center">
      <img src="/images/generate-schedule.png" alt="Generați orarul" className="img-fluid mb-3" style={{ maxWidth: "100%", objectFit: "contain" }} />
      <h5>3. Generați orarul</h5>
      <p className="text-muted">Platforma generează automat orarul optim folosind algoritmi inteligenți — în doar câteva minute.</p>
    </div>

    <div className="col-md-3 text-center">
      <img src="/images/edit-schedule.png" alt="Editați orarul" className="img-fluid mb-3" style={{ maxWidth: "100%", objectFit: "contain" }} />
      <h5>4. Editați și regenerați</h5>
      <p className="text-muted">Previzualizați orarul, faceți ajustări personalizate sau regenerați rapid o nouă variantă.</p>
    </div>

  </div>
</section>

      <section className="container py-5">
        <h2 className="text-center fw-bold mb-5">Caracteristici</h2>
        <div className="row g-4">
          {[{
            icon: "📝", title: "Introducere rapidă a datelor", desc: "Datele se pot introduce folosind un fișier Excel foarte ușor de redactat. Puteți apoi modifica aceste date și genera orarul."
          }, {
            icon: "⚙️", title: "Personalizare orar", desc: "Înainte să generați orarul, puteți seta regulile de generare așa cum doriți, astfel încât rezultatul final să fie pe placul dumneavoastră."
          }, {
            icon: "∞", title: "Număr nelimitat de generări", desc: "Puteți genera oricâte orare doriți, nu există o limită în acest sens."
          }, {
            icon: "⚡", title: "Generare rapidă", desc: "În funcție de complexitatea datelor, generarea nu ar trebui să dureze mai mult de 5 minute."
          }, {
            icon: "📋", title: "Raport de generare", desc: "Orarul generat vine însoțit de un raport cu toate constrângerile încălcate și sfaturi pentru a le rezolva."
          }, {
            icon: "✅", title: "Editare orar", desc: "După generare, puteți muta, șterge sau fixa ore. Vizualizare duală pentru elevi și profesori."
          }, {
            icon: "🔄", title: "Regenerare orar", desc: "Ați greșit o încadrare sau au apărut modificări? Regenerați rapid orarul cu noile date."
          }, {
            icon: "🖨️", title: "Printare orar", desc: "Puteți printa orarul pentru elevi sau profesori în format A4 sau A0, inclusiv pentru avizier."
          }, {
            icon: "📤", title: "Distribuiți orarul", desc: "Distribuiți rezultatul final colegilor sau profesorilor printr-un link extern."
          }].map((item, idx) => (
            <div key={idx} className="col-md-4">
              <div className="border rounded-4 shadow-sm h-100 p-4">
                <h5>{item.icon} {item.title}</h5>
                <p className="text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-5">
          <Link to="/register" className="btn btn-primary rounded-pill px-4 py-2">
            Creați un cont gratuit
          </Link>
        </div>
      </section>

      <section className="container text-center py-5">
        <h2>Așteptăm mesajul dvs!</h2>
        <p className="text-muted"> Aveți întrebări despre platformă sau funcționalități? Echipa noastră este gata să vă răspundă. </p>
        <Link to="/contact" className="btn btn-outline-primary btn-lg rounded-pill px-4 mt-3">
          Trimiteți un mesaj
        </Link>
      </section>

      <div className="text-center mt-4">
      <Link to="/profesori" className="btn btn-success btn-lg rounded-pill px-5">
        Generează Orarul
      </Link>
      </div>

    

      <footer className="text-center py-4 bg-light">
        <p className="mb-0">&copy; 2025 Generator Orare. Toate drepturile rezervate.</p>
      </footer>
    </div>
  );
};

export default Home;