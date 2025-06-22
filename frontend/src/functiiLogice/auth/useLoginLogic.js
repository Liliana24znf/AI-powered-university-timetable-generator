import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const useLoginLogic = () => {
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [loading, setLoading] = useState(false);
  const [afiseazaParola, setAfiseazaParola] = useState(false);
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !parola.trim()) {
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
        body: JSON.stringify({ email, parola }),
      });

      const data = await response.json();

      if (data.status === "success") {
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Autentificat cu succes!");
        setTimeout(() => navigate("/"), 2000);
      } else {
        toast.error(data.message || "Eroare la autentificare.");
      }
    } catch (error) {
      console.error("Eroare la login:", error);
      toast.error("Eroare la conectare cu serverul.");
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    parola,
    setParola,
    afiseazaParola,
    setAfiseazaParola,
    loading,
    handleLogin,
    emailRegex,
  };
};

export default useLoginLogic;
