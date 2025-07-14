// useProfesoriLogic.js
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const useProfesoriLogic = () => {
  const navigate = useNavigate();

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profesorEditat, setProfesorEditat] = useState(null);
  const [touchedFields, setTouchedFields] = useState({ nume: false, discipline: [] });

  const [formular, setFormular] = useState({
    nume: "",
    discipline: [{ denumire: "", nivel: "", tipuri: [] }],
    disponibilitate: { Luni: [], Marti: [], Miercuri: [], Joi: [], Vineri: [] }
  });

  const fetchProfesori = async () => {
    try {
      const res = await fetch("http://localhost:5000/toti_profesorii");
      const data = await res.json();
      if (Array.isArray(data)) {
        const sorted = data.toSorted((a, b) => a.nume.localeCompare(b.nume));
        setLista(sorted.map(p => ({
          id: p.id,
          nume: p.nume,
          disponibilitate: typeof p.disponibilitate === "string" ? JSON.parse(p.disponibilitate) : p.disponibilitate || {},
          discipline: Array.isArray(p.discipline) ? p.discipline : []
        })));
      }
    } catch (err) {
      console.error("Eroare la fetch:", err);
    }
  };

  useEffect(() => {
    fetchProfesori();
  }, []);

  const isInvalid = (value) => value.trim() === "";

  const handleFormChange = (field, value) => {
    setFormular({ ...formular, [field]: value });
  };

  const handleDisciplinaChange = (index, key, value) => {
    const discipline = [...formular.discipline];
    discipline[index][key] = value;
    setFormular({ ...formular, discipline });
  };

  const adaugaDisciplina = () => {
    setFormular({ ...formular, discipline: [...formular.discipline, { denumire: "", nivel: "", tipuri: [] }] });
  };

  const stergeDisciplina = (index) => {
    setFormular(prev => ({
      ...prev,
      discipline: prev.discipline.filter((_, i) => i !== index),
    }));
  };

  const toggleTipActivitate = (index, tip) => {
    const discipline = [...formular.discipline];
    const tipuri = discipline[index].tipuri || [];
    discipline[index].tipuri = tipuri.includes(tip)
      ? tipuri.filter(t => t !== tip)
      : [...tipuri, tip];
    setFormular({ ...formular, discipline });
  };

  const toggleIntervalDisponibil = (zi, interval) => {
  const curente = formular.disponibilitate[zi] || [];
  const actualizat = curente.includes(interval)
    ? curente.filter(i => i !== interval)
    : [...curente, interval];
  setFormular({
    ...formular,
    disponibilitate: {
      ...formular.disponibilitate,
      [zi]: actualizat,
    }
  });
};


  const handleBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlurDisciplina = (index) => {
    setTouchedFields((prev) => {
      const updated = [...prev.discipline];
      updated[index] = true;
      return { ...prev, discipline: updated };
    });
  };

  const validateFormular = () => {
    let valid = true;
    if (isInvalid(formular.nume)) {
      setTouchedFields(prev => ({ ...prev, nume: true }));
      valid = false;
    }

    const disciplineTouched = [...touchedFields.discipline];
    for (let i = 0; i < formular.discipline.length; i++) {
      const d = formular.discipline[i];
      if (!d.denumire || !d.nivel || !d.tipuri?.length) {
        disciplineTouched[i] = true;
        valid = false;
      }
    }
    setTouchedFields(prev => ({ ...prev, discipline: disciplineTouched }));

    const hasDisponibilitate = Object.values(formular.disponibilitate).some(list => list.length > 0);
    if (!hasDisponibilitate) {
      Swal.fire("⚠️ Atenție", "Selectează cel puțin un interval de disponibilitate.", "warning");
      valid = false;
    }

    if (!valid) {
      Swal.fire("⚠️ Atenție", "Te rugăm să completezi toate câmpurile obligatorii.", "warning");
    }

    return valid;
  };

  const resetFormular = () => {
    setFormular({
      nume: "",
      discipline: [{ denumire: "", nivel: "", tipuri: [] }],
      disponibilitate: { Luni: [], Marti: [], Miercuri: [], Joi: [], Vineri: [] }
    });
    setProfesorEditat(null);
  };

  const adaugaProfesor = async () => {
    if (!validateFormular()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/adauga_profesor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formular)
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire("✅ Succes", "Profesorul a fost salvat cu succes!", "success");
        fetchProfesori();
        resetFormular();
        setTouchedFields({ nume: false, discipline: Array(formular.discipline.length).fill(false) });
      } else {
        Swal.fire("❌ Eroare", data.message || "A apărut o eroare.", "error");
      }
    } catch {
      Swal.fire("❌ Eroare", "A apărut o eroare la salvare.", "error");
    } finally {
      setLoading(false);
    }
  };

  const actualizeazaProfesor = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/actualizeaza_profesor/${profesorEditat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nume: formular.nume.trim(),
          disponibilitate: formular.disponibilitate,
          discipline: formular.discipline
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success("🔁 Profesor actualizat!");
        fetchProfesori();
        resetFormular();
        setTouchedFields({ nume: false, discipline: Array(formular.discipline.length).fill(false) });
        setProfesorEditat(null);
      } else {
        toast.error("❌ " + result.error);
      }
    } catch {
      toast.error("❌ Eroare la conexiune.");
    }
    setLoading(false);
  };

  const stergeProfesor = async (id) => {
    const confirm = await Swal.fire({
      title: "Ești sigur?",
      text: "Profesorul va fi șters definitiv.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Da, șterge!",
      cancelButtonText: "Anulează",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/sterge_profesor/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (result.success) {
        toast.success("✅ Profesor șters!");
        fetchProfesori();
      } else {
        toast.error("❌ " + result.error);
      }
    } catch {
      toast.error("❌ Eroare la conexiune.");
    }
    setLoading(false);
  };

  return {
    navigate,
    lista,
    formular,
    setFormular,
    touchedFields,
    setTouchedFields,
    profesorEditat,
    setProfesorEditat,
    loading,
    searchTerm,
    setSearchTerm,
    handleFormChange,
    handleDisciplinaChange,
    adaugaDisciplina,
    stergeDisciplina,
    toggleTipActivitate,
    toggleIntervalDisponibil,
    handleBlur,
    handleBlurDisciplina,
    adaugaProfesor,
    actualizeazaProfesor,
    stergeProfesor,
    resetFormular,
    fetchProfesori,
    isInvalid
  };
};

export default useProfesoriLogic;
