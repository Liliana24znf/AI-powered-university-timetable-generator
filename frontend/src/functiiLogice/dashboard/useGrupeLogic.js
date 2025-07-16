// useGrupeLogic.js
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const useGrupeLogic = () => {
  const [nivel, setNivel] = useState("Licenta");
  const [an, setAn] = useState("I");
  const [nrGrupe, setNrGrupe] = useState(1);
  const [nrSubgrupe, setNrSubgrupe] = useState(1);
  const [grupeGenerat, setGrupeGenerat] = useState([]);
  const [grupeSelectate, setGrupeSelectate] = useState([]);
  const [editSectiune, setEditSectiune] = useState(null);
  const [grupaNoua, setGrupaNoua] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const getSubgrupaLitera = (index) => String.fromCharCode("a".charCodeAt(0) + index);

  const fetchGrupe = async () => {
    setIsLoading(true);
    setEditSectiune(null); 
    setGrupeSelectate([]);
    try {
      const res = await fetch("http://localhost:5000/toate_grupe");
      const data = await res.json();
      if (Array.isArray(data)) {
        setGrupeGenerat(data);
      }
    } catch {
      toast.error("❌ Eroare la încărcarea grupelor.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrupe();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (editSectiune) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editSectiune]);

  const genereazaGrupe = async () => {
    const existente = new Set(grupeGenerat.map((gr) => gr.denumire));
    const noiGrupe = [];

    for (let g = 1; g <= nrGrupe; g++) {
      for (let s = 0; s < nrSubgrupe; s++) {
        const subgrupa = getSubgrupaLitera(s);
        const denumire = `${nivel[0]}${an}${g}${subgrupa}`;
        if (!existente.has(denumire)) {
          noiGrupe.push({ nivel, an, grupa: g.toString(), subgrupa, denumire });
        }
      }
    }

    if (!noiGrupe.length) return toast.info("ℹ️ Nu sunt grupe noi de adăugat.");

    try {
      const res = await fetch("http://localhost:5000/adauga_grupe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noiGrupe),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("✅ Grupele au fost salvate.");
        fetchGrupe();
        setNivel("Licenta");
        setAn("I");
        setNrGrupe(1);
        setNrSubgrupe(1);
      } else toast.error("❌ " + result.error);
    } catch {
      toast.error("❌ Eroare la salvare grupe.");
    }
  };

  const adaugaGrupaIndividuala = async () => {
    const regex = /^(\d{1,2})([a-zA-Z])$/;
    const match = regex.exec(grupaNoua.trim());
    if (!match) return toast.error("⚠️ Format invalid. Exemplu corect: 2b sau 10A");

    const [, grupaRaw, subgrupaRaw] = match;
    const grupa = grupaRaw.replace(/^0+/, "");
    const subgrupa = subgrupaRaw.toLowerCase();
    const denumire = `${editSectiune.nivel[0]}${editSectiune.an}${grupa}${subgrupa}`;

    if (grupeGenerat.find((g) => g.denumire === denumire)) {
      return toast.info("ℹ️ Grupa există deja.");
    }

    try {
      const res = await fetch("http://localhost:5000/adauga_grupe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ nivel: editSectiune.nivel, an: editSectiune.an, grupa, subgrupa, denumire }]),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("✅ Grupa a fost adăugată.");
        setGrupaNoua("");
        setEditSectiune(null);
        fetchGrupe();
      } else toast.error("❌ " + result.error);
    } catch {
      toast.error("❌ Eroare la adăugare.");
    }
  };

  const stergeGrupa = async (cod) => {
    const confirm = await Swal.fire({
      title: "Ștergere grupă?",
      text: `Grupa ${cod} va fi ștearsă.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Da, șterge!",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch("http://localhost:5000/sterge_grupe_selectate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coduri: [cod] }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`✅ Grupa ${cod} a fost ștearsă.`);
        fetchGrupe();
      } else toast.error("❌ " + result.error);
    } catch {
      toast.error("❌ Eroare la conexiune.");
    }
  };

  const stergeSelectie = async () => {
    if (!grupeSelectate.length) return toast.info("ℹ️ Selectează cel puțin o grupă.");
    const confirm = await Swal.fire({
      title: "Ștergere selecție?",
      text: "Grupele selectate vor fi șterse.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Da, șterge!",
      
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch("http://localhost:5000/sterge_grupe_selectate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coduri: grupeSelectate }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("✅ Grupele selectate au fost șterse.");
        setGrupeSelectate([]);
        fetchGrupe();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else toast.error("❌ " + result.error);
    } catch {
      toast.error("❌ Eroare la ștergere.");
    }
  };

  const toggleSelect = (cod) => {
    setGrupeSelectate((prev) =>
      prev.includes(cod) ? prev.filter((c) => c !== cod) : [...prev, cod]
    );
  };

  const grupePeNivelSiAn = () => {
    const grupate = {};
    grupeGenerat
      .filter((gr) => gr.denumire.toLowerCase().includes(searchTerm.toLowerCase()))
      .forEach((gr) => {
        const cheie = `${gr.nivel} - Anul ${gr.an}`;
        if (!grupate[cheie]) grupate[cheie] = [];
        grupate[cheie].push(gr);
      });

    const ordineaAni = { I: 1, II: 2, III: 3, IV: 4 };
    const ordineaNivele = { Licenta: 1, Master: 2 };

    return Object.entries(grupate)
      .sort(([a], [b]) => {
        const [nivelA, anA] = a.split(" - Anul ");
        const [nivelB, anB] = b.split(" - Anul ");
        return ordineaNivele[nivelA] - ordineaNivele[nivelB] || ordineaAni[anA] - ordineaAni[anB];
      })
      .map(([cheie, grupe]) => ({
        titlu: cheie,
        grupe: grupe.sort((a, b) =>
          parseInt(a.grupa) - parseInt(b.grupa) || a.subgrupa.localeCompare(b.subgrupa)
        ),
      }));
  };


    // 🔁 Funcții extrase (evită nesting excesiv)
  const handleEditSectiune = (titlu) => {
    const [nivel, an] = titlu.split(" - Anul ");
    setEditSectiune({ nivel, an });
  };
const isGroupInSection = (cod, grupeSectiune) => {
  return grupeSectiune.some((gr) => gr.denumire === cod);
};

  const handleToggleAll = (sectiune) => {
    const toateSelectate = sectiune.grupe.every((gr) => grupeSelectate.includes(gr.denumire));
    if (toateSelectate) {
      setGrupeSelectate((prev) =>
        prev.filter((cod) => !isGroupInSection(cod, sectiune.grupe))
      );
    } else {
      setGrupeSelectate((prev) => [
        ...prev,
        ...sectiune.grupe.map((g) => g.denumire).filter((cod) => !prev.includes(cod))
      ]);
    }
  };



  return {
    nivel, setNivel,
    an, setAn,
    nrGrupe, setNrGrupe,
    nrSubgrupe, setNrSubgrupe,
    grupeGenerat, grupeSelectate,
    grupaNoua, setGrupaNoua,
    isLoading, searchTerm, setSearchTerm,
    editSectiune, setEditSectiune,
    genereazaGrupe, adaugaGrupaIndividuala,
    stergeGrupa, stergeSelectie,
    toggleSelect, grupePeNivelSiAn,
    fetchGrupe,
    handleEditSectiune, handleToggleAll,
  };
};

export default useGrupeLogic;
