import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Dashboard = () => {
  return (
<div
  style={{
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column"
  }}
  className="p-0 m-0"
>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <span className="fw-bold fs-4">Generator Orare</span>
          </div>
          <Link to="/" className="btn btn-outline-dark">
  <i className="bi bi-house"></i> Acasă
</Link>
          
        </div>
      </nav>
      

     {/* Conținut Centrat */}
<div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center px-3">
  <img
    src="/images/calendar-illustration.png"
    alt="Calendar"
    style={{ maxWidth: "300px", marginBottom: "30px" }}
  />
  <h2 className="fw-bold">Pregătiți-vă pentru generarea orarului</h2>
  <p className="text-muted w-75 mx-auto mt-3">
    Pentru a genera un orar corect și complet, este necesar să parcurgeți câțiva pași simpli:
  </p>
  <p className="text-muted w-75 mx-auto">
    Mai întâi, veți introduce sălile disponibile pentru cursuri, seminare și laboratoare. Apoi, veți adăuga profesorii împreună cu disciplinele predate și tipurile de activități (curs, laborator, seminar).
  </p>
  <p className="text-muted w-75 mx-auto">
    După completarea acestor informații, veți putea accesa pagina de generare a orarului, unde sistemul va aplica regulile și condițiile definite pentru a crea orarul final.
  </p>

  <Link to="/grupe" className="btn btn-primary mt-4 px-4 py-2">
    Să începem!
  </Link>
</div>
      {/* Footer */}
      <footer className="bg-light text-center py-4 mt-auto">
        <p className="mb-0">© 2023 Generator Orare. Toate drepturile rezervate.</p>
      </footer>

    </div>
  );
};

export default Dashboard;
