import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Parolele nu coincid!");
      return;
    }
    alert(`Înregistrare reușită pentru ${name} cu email: ${email}`);
    navigate("/login"); 
  };

  return (

    <div
  className="d-flex justify-content-center align-items-center vh-100"
  style={{
    backgroundImage: "url('/images/login.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    width: "100vw",
    height: "100vh", // adăugat pentru siguranță
  }}
>

      {/* Card Register - Form Centrat */}
      <div
        className="card shadow-lg p-4 text-center"
        style={{
          width: "400px",
          borderRadius: "15px",
          background: "#fff",
          border: "none",
        }}
      >
        <h3 className="text-primary fw-bold">Înregistrare</h3> {/* Schimbat în verde */}
        <p className="text-muted">Creează un cont nou pentru a începe!</p>
        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Nume</label>
            <input
              type="text"
              className="form-control p-2"
              placeholder="Introduceți numele"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
            />
          </div>
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
          <div className="mb-3">
            <label className="form-label fw-semibold">Confirmă Parola</label>
            <input
              type="password"
              className="form-control p-2"
              placeholder="Reintroduceți parola"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            Înregistrează-te
          </button>
        </form>
        <p className="mt-3">
          Ai deja cont?{" "}
          <Link to="/login" className="text-decoration-none fw-semibold text-primary">
            Autentifică-te
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
