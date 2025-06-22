import React from "react";
import { Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import useLoginLogic from "../functiiLogice/auth/useLoginLogic";

const Login = () => {
  const {
    email,
    setEmail,
    parola,
    setParola,
    afiseazaParola,
    setAfiseazaParola,
    loading,
    handleLogin,
  } = useLoginLogic();

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
        className="card shadow p-4 text-center"
        style={{
          maxInlineSize: "400px",
          inlineSize: "100%",
          borderRadius: "15px",
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h3 className="text-primary fw-bold">Autentificare</h3>
        <p className="text-muted mb-4">Bine ai revenit! Te rugăm să te autentifici.</p>

        <form onSubmit={handleLogin}>
          <div className="mb-3 text-start">
            <label htmlFor="email" className="form-label fw-semibold">Email</label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <FaEnvelope className="text-muted" />
              </span>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="Introduceți email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="mb-3 text-start">
            <label htmlFor="parola" className="form-label fw-semibold">Parolă</label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <FaLock className="text-muted" />
              </span>
              <input
                id="parola"
                type={afiseazaParola ? "text" : "password"}
                className="form-control"
                placeholder="Introduceți parola"
                value={parola}
                onChange={(e) => setParola(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setAfiseazaParola(!afiseazaParola)}
                tabIndex={-1}
              >
                {afiseazaParola ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 fw-bold mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Se autentifică...
              </>
            ) : (
              "Autentificare"
            )}
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
