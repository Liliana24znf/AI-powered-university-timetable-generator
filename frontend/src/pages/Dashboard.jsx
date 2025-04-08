import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Dashboard = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#f7f4fb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <span className="fw-bold fs-4">Generator Orare</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-outline-dark">+ Generare nouă</button>
            <i className="bi bi-bell" style={{ fontSize: "20px" }}></i>
            <i className="bi bi-question-circle" style={{ fontSize: "20px" }}></i>
          </div>
        </div>
      </nav>

      {/* Conținut Centrat */}
      <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center px-3">
        <img
          src="/images/calendar-illustration.png"
          alt="Calendar"
          style={{ maxWidth: "400px", marginBottom: "30px" }}
        />
        <h2 className="fw-bold">Generați primul orar!</h2>
        <p className="text-muted w-75 mx-auto mt-3">
          Aveți nevoie doar de încadrarea profesorilor din universitatea dumneavoastră și de câteva minute.
          Folosiți butonul de mai jos pentru a completa datele. Veți fi ghidat pas cu pas pentru a le completa și a genera orarul.
        </p>

        <Link to="/sali" className="btn btn-primary mt-4 px-4 py-2">
          Să începem!
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
