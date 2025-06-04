import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEye, FaEyeSlash, FaEnvelope, FaUser, FaLock } from "react-icons/fa";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.warning("Toate câmpurile sunt obligatorii!");
      return;
    }

    if (!emailRegex.test(email)) {
      toast.error("Adresa de email introdusă nu este validă!");
      return;
    }

    if (password.length < 6) {
      toast.error("Parola trebuie să aibă minim 6 caractere.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Parolele nu coincid!");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nume: name, email, parola: password }),
      });

      const data = await response.json();
      if (data.status === "success") {
        toast.success("Cont creat cu succes! Redirecționare în 3 secunde...");
        setTimeout(() => navigate("/"), 3000);
      } else {
        toast.error(data.message || "Eroare la înregistrare.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Eroare la conectare cu serverul.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        backgroundImage: "url('/images/login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <ToastContainer />
      <div
        className="card shadow p-4"
        style={{
          inlineSize: "100%",
          maxInlineSize: "400px",
          borderRadius: "15px",
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h3 className="text-primary fw-bold text-center">Înregistrare</h3>
        <p className="text-muted text-center mb-4">
          Creează un cont nou pentru a începe!
        </p>
        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label fw-semibold">
              Nume
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <FaUser className="text-muted" />
              </span>
              <input
                id="name"
                type="text"
                className="form-control"
                placeholder="Introduceți numele"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">
              Email
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <FaEnvelope className="text-muted" />
              </span>
              <input
                id="email"
                type="email"
                className={`form-control ${email && !emailRegex.test(email) ? "is-invalid" : ""}`}
                placeholder="Introduceți email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <div className="invalid-feedback">Format email invalid</div>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-semibold">Parolă</label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <FaLock className="text-muted" />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Introduceți parola"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <small className="text-muted" title="Minim 6 caractere. Folosește o literă mare și o cifră.">
              Parolă sigură
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Confirmă Parola</label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <FaLock className="text-muted" />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-control"
                placeholder="Reintroduceți parola"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 fw-bold"
            disabled={loading}
          >
            {loading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Se înregistrează...
              </span>
            ) : (
              "Înregistrează-te"
            )}
          </button>
        </form>
        <p className="mt-3 text-center">
          Ai deja cont? {" "}
          <Link
            to="/login"
            className="text-decoration-none fw-semibold text-primary"
          >
            Autentifică-te
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;