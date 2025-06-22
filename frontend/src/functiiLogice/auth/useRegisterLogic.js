import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const useRegisterLogic = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.warning("Completează toate câmpurile!");
      return;
    }

    if (!emailRegex.test(email)) {
      toast.error("Email invalid.");
      return;
    }

    if (password.length < 6) {
      toast.error("Parola trebuie să conțină minim 6 caractere.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Parolele nu coincid.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nume: name, email, parola: password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user || { username: email, name: name }));

        toast.success("Înregistrare reușită! Redirecționare...");
        setTimeout(() => {
          navigate("/"); // redirect către Home
        }, 1500);
      } else {
        toast.error(data.message || "Eroare la înregistrare.");
      }
    } catch (error) {
      console.error("Eroare la înregistrare:", error);
      toast.error("Eroare de rețea sau server.");
    } finally {
      setLoading(false);
    }
  };

  return {
    name, setName,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    loading,
    handleRegister,
    emailRegex
  };
};

export default useRegisterLogic;
