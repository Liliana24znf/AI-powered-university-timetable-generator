import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const SetareReguli = () => {
  const navigate = useNavigate();

  const [reguli, setReguli] = useState(`📜 REGULI STRICTE PENTRU GENERAREA ORARULUI:
(... aici tot textul tău lung complet ...)`);

  const salveazaReguli = async () => {
    try {
      const response = await fetch("http://localhost:5000/salveaza_reguli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reguli }),
      });

      const data = await response.json();
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Regulile au fost salvate",
          showConfirmButton: false,
          timer: 1500,
        });
        navigate("/orar-generat");
      } else {
        throw new Error(data.error || "Eroare necunoscută");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Eroare la salvare",
        text: error.message,
      });
    }
  };

  return (
    <div className="container pt-4 px-4">
      <h2 className="mb-4 text-primary">📋 Introducere reguli pentru generare orar</h2>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <label className="form-label fw-bold">📝 Editare reguli:</label>
          <textarea
            className="form-control"
            rows={15}
            value={reguli}
            onChange={(e) => setReguli(e.target.value)}
          />
        </div>
      </div>

      <button className="btn btn-success" onClick={salveazaReguli}>
        🚀 Salvează și continuă către generarea orarului
      </button>
    </div>
  );
};

export default SetareReguli;
