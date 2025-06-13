import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const useSetariReguli = () => {
  const navigate = useNavigate();

const regulaVizibila = `📜 REGULI STRICTE PENTRU GENERAREA ORARULUI:
Se vor genera orare complete pentru fiecare NIVEL (Licență/Master) și fiecare AN, GRUPĂ și SUBGRUPĂ disponibilă, pentru zilele Luni–Vineri.

1. Structurarea activităților:
   - Cursurile se desfășoară cu ANUL (toate grupele dintr-un an participă împreună).
   - Seminarele și proiectele se desfășoară pe GRUPĂ.
   - Laboratoarele se desfășoară pe SUBGRUPĂ.

2. Intervalele orare disponibile:
   - 08:00–10:00, 10:00–12:00, 12:00–14:00, 14:00–16:00, 16:00–18:00, 18:00–20:00

3. Program zilnic:
   - Licență: între 08:00 și 20:00
   - Master: între 16:00 și 20:00
   - Fiecare grupă/subgrupă trebuie să aibă între 4 și 8 ore de activități pe zi
   - Este permisă cel mult o pauză de 2 ore pe zi (maxim o fereastră)
   - Este recomandat ca programul să nu aibă ferestre

4. Repartizarea sălilor:
   - Cursurile se țin în săli cu prefix GC (ex: GC1, GC2)
   - Seminarele se țin în săli cu prefix GS
   - Proiectele în săli cu prefix GP
   - Laboratoarele în săli cu prefix GL

5. Ziua de miercuri:
   - Intervalul 14:00–16:00 este liber pentru toate grupele
   - În restul intervalelor din acea zi trebuie să existe activități

6. Format afișare activități:
   - Cursuri: denumirea completă + acronim + profesor + sală (ex: Programare (PR) – Ion Popescu – GC1)
   - Seminare/proiecte/laboratoare: acronim + profesor + sală (ex: PR – Ion Popescu – GL2)

7. Nu se vor inventa profesori, discipline sau săli. Se vor folosi doar datele disponibile.

8. Orarul trebuie să fie complet, valid și să conțină activități pentru fiecare grupă/subgrupă în fiecare zi (cu excepția intervalului 14:00–16:00 miercuri).

‼️ Activitățile trebuie să conțină câmpuri distincte: activitate, tip, profesor, sală.
‼️ Nu combina detalii într-un singur câmp și nu omite nicio zi.`;

  const [reguli, setReguli] = useState(regulaVizibila);
  const [idRegulaEditata, setIdRegulaEditata] = useState(null);
  const [reguliFiltrate, setReguliFiltrate] = useState([]);
  const [ultimeleReguli, setUltimeleReguli] = useState([]);
  const [numeRegula, setNumeRegula] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const incarcaUltimeleReguli = async () => {
      try {
        const response = await fetch("http://localhost:5000/ultimele_reguli");
        const data = await response.json();
        setUltimeleReguli(data);
        setReguliFiltrate(data);
      } catch (err) {
        console.error("Eroare la încărcarea regulilor:", err);
      }
    };
    incarcaUltimeleReguli();
  }, []);

  const salveazaReguli = async () => {
    if (!numeRegula.trim()) {
      Swal.fire({ icon: "warning", title: "Denumirea este necesară" });
      return;
    }
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/salveaza_reguli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reguli, denumire: numeRegula })
      });
      const data = await response.json();
      if (data.success) {
        Swal.fire({ icon: "success", title: "Regula a fost salvată", showConfirmButton: false, timer: 1500 });
        const reload = await fetch("http://localhost:5000/ultimele_reguli");
        const reguliNoi = await reload.json();
        setUltimeleReguli(reguliNoi);
        const regulaNoua = reguliNoi.find(r => r.denumire.trim() === numeRegula.trim());
        if (regulaNoua) {
          setIdRegulaEditata(regulaNoua.id);
          setNumeRegula(regulaNoua.denumire);
        }
      } else {
        throw new Error(data.error || "Eroare necunoscută");
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Eroare la salvare", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return {
    navigate,
    regulaVizibila,
    reguli,
    setReguli,
    idRegulaEditata,
    setIdRegulaEditata,
    reguliFiltrate,
    setReguliFiltrate,
    ultimeleReguli,
    setUltimeleReguli,
    numeRegula,
    setNumeRegula,
    loading,
    setLoading,
    salveazaReguli
  };
};

export default useSetariReguli;
