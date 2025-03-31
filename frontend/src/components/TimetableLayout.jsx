import React from "react";
import { Outlet, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const TimetableLayout = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f7f4fb",
      }}
    >
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm px-4 py-3">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
            <span className="fw-bold fs-4 text-primary">Generator Orare</span>
          </Link>

          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-outline-primary rounded-pill fw-semibold">
              + Generare nouă
            </button>
            <i className="bi bi-bell-fill text-secondary fs-5"></i>
            <i className="bi bi-question-circle-fill text-secondary fs-5"></i>
            <div className="text-end">
              <div className="fw-semibold">Universitatea Galați</div>
              <small className="text-muted">zanfrililiana98@gmail.com</small>
            </div>
          </div>
        </div>
      </nav>

      {/* Conținut */}
      <main className="flex-grow-1 d-flex justify-content-center align-items-start w-100 px-3 py-5">
        <div className="w-100" style={{ maxWidth: "1140px" }}>
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 bg-light mt-auto w-100 border-top">
        <p className="mb-0 text-muted">
          &copy; 2025 <span className="fw-semibold">Generator Orare</span>. Toate drepturile rezervate.
        </p>
      </footer>
    </div>
  );
};

export default TimetableLayout;
