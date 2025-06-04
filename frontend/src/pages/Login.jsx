import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // 🔒 Dacă e deja logat, redirect către pagina principală
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/home", { replace: true }); // ⛔ prevenim întoarcerea cu Back
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.warning("Toate câmpurile sunt obligatorii!");
      return;
    }

    if (!emailRegex.test(email)) {
      toast.error("Adresa de email este invalidă!");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, parola: password }),
      });

      const data = await response.json();
      if (data.status === "success") {
        localStorage.setItem("user", email); // ✅ salvare sesiune
        toast.success("Autentificat cu succes!");
        setTimeout(() => navigate("/home"), 2000); // 🔁 redirect
      } else {
        toast.error(data.message || "Eroare la autentificare.");
      }
    } catch (error) {
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
        className="card shadow p-4 text-center"
        style={{
          maxWidth: "400px",
          width: "100%",
          borderRadius: "15px",
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h3 className="text-primary fw-bold">Autentificare</h3>
        <p className="text-muted mb-4">Bine ai revenit! Te rugăm să te autentifici.</p>

        <form onSubmit={handleLogin}>
          <div className="mb-3 text-start">
            <label className="form-label fw-semibold">Email</label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <FaEnvelope className="text-muted" />
              </span>
              <input
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
            <label className="form-label fw-semibold">Parolă</label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <FaLock className="text-muted" />
              </span>
              <input
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
