import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const useDashboardLogic = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return {
    user,
    handleLogout,
  };
};

export default useDashboardLogic;
