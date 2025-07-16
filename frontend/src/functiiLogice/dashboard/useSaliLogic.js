import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const useSaliLogic = () => {
  const [numarCursuri, setNumarCursuri] = useState(0);
  const [numarLaboratoare, setNumarLaboratoare] = useState(0);
  const [numarSeminare, setNumarSeminare] = useState(0);
  const [numarProiecte, setNumarProiecte] = useState(0);
  const [saliGenerat, setSaliGenerat] = useState([]);
  const [saliSelectate, setSaliSelectate] = useState([]);
  const [resetKey, setResetKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSali = async () => {
    try {
      const response = await fetch("http://localhost:5000/toate_sali");
      const data = await response.json();
      if (Array.isArray(data)) {
        setSaliSelectate([]);
        setNumarCursuri(0);
        setNumarLaboratoare(0);
        setNumarSeminare(0);
        setNumarProiecte(0);
        setSaliGenerat(data);
        setResetKey(prev => prev + 1);
      }
    } catch (err) {
      console.error("Eroare la încărcare săli:", err);
    }
  };

  const genereazaSali = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/toate_sali");
      const existente = await response.json();

      const genereazaCoduri = (prefix, tip, count, existente) => {
        const coduriExistente = existente
          .filter((s) => s.tip === tip && s.cod.startsWith(prefix))
          .map((s) => parseInt(s.cod.replace(prefix, "")))
          .sort((a, b) => a - b);

        const coduriNoi = [];
        let next = 1;
        while (coduriNoi.length < count) {
          if (!coduriExistente.includes(next)) {
            coduriNoi.push({ cod: `${prefix}${next}`, tip });
          }
          next++;
        }

        return coduriNoi;
      };

      const noi = [
        ...genereazaCoduri("GC", "Curs", numarCursuri, existente),
        ...genereazaCoduri("GL", "Laborator", numarLaboratoare, existente),
        ...genereazaCoduri("GS", "Seminar", numarSeminare, existente),
        ...genereazaCoduri("GP", "Proiect", numarProiecte, existente),
      ];

      if (noi.length === 0) {
        toast.info("Nu sunt săli noi de adăugat.");
        setIsLoading(false);
        return;
      }

      const saveResponse = await fetch("http://localhost:5000/adauga_sali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noi),
      });

      const result = await saveResponse.json();
      if (result.success) {
        toast.success("✅ Sălile au fost salvate!");
        fetchSali();
      } else {
        toast.error("❌ " + result.error);
      }
    } catch (error) {
      toast.error("❌ Eroare la generare/trimite săli.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const stergeSelectie = async () => {
    if (saliSelectate.length === 0)
      return toast.info("Selectează cel puțin o sală.");

    const confirm = await Swal.fire({
      title: "Ești sigur?",
      text: "Această acțiune va șterge sălile selectate.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Da, șterge!",
      cancelButtonText: "Anulează",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch("http://localhost:5000/sterge_sali_selectate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coduri: saliSelectate }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("✅ Sălile au fost șterse.");
        setSaliSelectate([]);
        fetchSali();
        
      } else toast.error("❌ " + result.error);
    } catch (error) {
      toast.error("❌ Eroare la conexiune.");
      console.error(error);
    }
  };

  const toggleSelectSala = (cod) => {
    setSaliSelectate((prev) =>
      prev.includes(cod) ? prev.filter((s) => s !== cod) : [...prev, cod]
    );
  };

  const toggleSelectAllByTip = (tip, checked) => {
    const coduri = saliGenerat.filter((s) => s.tip === tip).map((s) => s.cod);
    setSaliSelectate((prev) =>
      checked
        ? Array.from(new Set([...prev, ...coduri]))
        : prev.filter((cod) => !coduri.includes(cod))
    );
  };

  const getTitluSala = (tip) => {
    switch (tip) {
      case "Curs":
        return "📘 Săli de Curs (GC)";
      case "Laborator":
        return "🧪 Săli de Laborator (GL)";
      case "Seminar":
        return "📝 Săli de Seminar (GS)";
      case "Proiect":
        return "💼 Săli de Proiect (GP)";
      default:
        return "";
    }
  };

  useEffect(() => {
    fetchSali();
  }, []);

  return {
    numarCursuri, setNumarCursuri,
    numarLaboratoare, setNumarLaboratoare,
    numarSeminare, setNumarSeminare,
    numarProiecte, setNumarProiecte,
    saliGenerat, saliSelectate,
    isLoading, resetKey,
    genereazaSali, stergeSelectie,
    toggleSelectSala, toggleSelectAllByTip,
    getTitluSala, fetchSali
  };
};

export default useSaliLogic;
