import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // <--- importat de la react-router-dom

  const handleLogin = (e) => {
    e.preventDefault();

    // Aici poți adăuga logica de autentificare reală
    if (email && password) {
      alert(`Autentificat cu succes!`);
      navigate("/dashboard"); // <--- redirecționare către Home
    } else {
      alert("Te rugăm să completezi toate câmpurile.");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        backgroundImage: "url('/images/login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        width: "100vw",
        height: "100vh",
      }}
    >
      {/* Card Login - Form Centrat */}
      <div
        className="card shadow-lg p-4 text-center"
        style={{
          width: "400px",
          borderRadius: "15px",
          background: "#fff",
          border: "none",
        }}
      >
        <h3 className="text-primary fw-bold">Autentificare</h3>
        <p className="text-muted">Bine ai revenit! Te rugăm să te autentifici.</p>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              className="form-control p-2"
              placeholder="Introduceți email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Parolă</label>
            <input
              type="password"
              className="form-control p-2"
              placeholder="Introduceți parola"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100 fw-bold"
            style={{
              borderRadius: "8px",
              background: "#007bff",
              border: "none",
              transition: "0.3s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#0056b3")}
            onMouseOut={(e) => (e.target.style.background = "#007bff")}
          >
            Autentificare
          </button>
        </form>
        <p className="mt-3">
          Nu ai cont?{" "}
          <Link to="/register" className="text-decoration-none fw-semibold text-primary">
            Înregistrează-te
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
