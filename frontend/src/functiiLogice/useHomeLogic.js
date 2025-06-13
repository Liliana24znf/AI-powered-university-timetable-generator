// src/hooks/useHomeLogic.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const useHomeLogic = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userStored = localStorage.getItem("user");
      if (userStored) {
        setUser(JSON.parse(userStored));
      }
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
      localStorage.removeItem("user");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return { user, handleLogout };
};

export default useHomeLogic;
