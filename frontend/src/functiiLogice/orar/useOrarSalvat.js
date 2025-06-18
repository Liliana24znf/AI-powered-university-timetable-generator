import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import useValidareOrar from "./useValidareOrar";

const useOrarSalvat = (
  orar,
  setOrar,
  grupe,
  setGrupe,
  setProfesori,
  setSali,
  setReguli,
  setNivelSelectat,
  anSelectat,            // ✅ Adăugat
  setAnSelectat,
  orar_id_selectat,
  cautareOrar,
  setRaportValidare,
  valideazaOrarGenerat 
) => {



  const [orareSalvate, setOrareSalvate] = useState([]);
  const [esteOrarSalvat, setEsteOrarSalvat] = useState(false);

useEffect(() => {
  const incarcaTot = async () => {
    try {
      const resDate = await fetch("http://localhost:5000/date_orar");
      const data = await resDate.json();

      const discipline = data.discipline || [];

      // Leagă disciplinele de profesori
      const profesoriCuDiscipline = (data.profesori || []).map((prof) => {
        const disciplineProf = discipline
          .filter((d) => d.profesor_id === prof.id)
          .map((d) => `${d.denumire} (${d.nivel}, ${d.tip})`)

        return { ...prof, discipline: disciplineProf };
      });

      setProfesori(profesoriCuDiscipline);
      setSali(data.sali || []);
      setGrupe(data.grupe || []);
      setReguli(data.reguli?.continut || "");

      if ((data.grupe || []).length > 0 && !anSelectat) {
        const ani = Array.from(new Set(data.grupe.map((g) => g.an))).sort();
        setAnSelectat(ani[0]);
      }

      const resOrare = await fetch("http://localhost:5000/orare_generate");
      const orare = await resOrare.json();
      setOrareSalvate(orare);
    } catch (err) {
      console.error("Eroare la încărcarea datelor:", err);
    }
  };

  incarcaTot();
}, []);


useEffect(() => {
  if (orar_id_selectat) {
    incarcaOrarSalvat(orar_id_selectat);
  }
}, [orar_id_selectat]);



const incarcaOrarSalvat = async (id) => {
  try {
    const r = await fetch(`http://localhost:5000/orar_generat/${id}`);
    const json = await r.json();
    console.log("Orar salvat încărcat:", json);
    setOrar(json);
    setEsteOrarSalvat(true);

    const nivel = Object.keys(json)[0];
    const grupa = Object.keys(json[nivel])[0];
    const grupaGasita = grupe.find((g) => g.denumire === grupa);
    if (grupaGasita) {
      setNivelSelectat(nivel);
      setAnSelectat(grupaGasita.an);
    }
     // ✅ Apelezi validarea după ce setezi orarul
    if (typeof valideazaOrarGenerat === "function") {
      valideazaOrarGenerat(json);
    }

  } catch (err) {
    console.error("Eroare la încărcare orar:", err);
  }
};



const stergeOrar = async (id) => {
  if (!window.confirm("Sigur dorești să ștergi acest orar?")) return;

  try {
    const res = await fetch(`http://localhost:5000/sterge_orar/${id}`, {
      method: "DELETE"
    });

    const result = await res.json();

    if (result.success) {
      setOrareSalvate((prev) => prev.filter((o) => o.id !== id));
      if (orar_id_selectat === id) {
        setOrar(null);
        setEsteOrarSalvat(false);
      }
    } else {
      alert("Eroare la ștergere: " + result.error);
    }
  } catch (err) {
    console.error("Eroare la ștergere orar:", err);
    alert("A apărut o eroare la ștergere.");
  }
};

const editeazaDenumire = async (id, numeCurent) => {
  const { value: nouNume } = await Swal.fire({
    title: "Editează denumirea orarului",
    input: "text",
    inputLabel: "Noua denumire",
    inputValue: numeCurent || "",
    showCancelButton: true,
    confirmButtonText: "Salvează",
    cancelButtonText: "Renunță",
  });

  if (nouNume && nouNume.trim()) {
    try {
      const r = await fetch(`http://localhost:5000/editeaza_orar/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nume: nouNume }),
      });
      const json = await r.json();

      if (json.success) {
  Swal.fire("✅ Salvare reușită", "", "success");
  setOrareSalvate((prev) =>
    prev.map((o) => (o.id === id ? { ...o, nume: nouNume } : o))
  );
}
 else {
        Swal.fire("Eroare la salvare", json.error || "", "error");
      }
    } catch (err) {
      Swal.fire("Eroare de rețea", err.message, "error");
    }
  }
};

const orareFiltrate = orareSalvate.filter((orar) =>
  (orar.nume || `${orar.nivel} – ${orar.an}`)
    .toLowerCase()
    .includes(cautareOrar.toLowerCase())
);

  return {
    orareSalvate,
    esteOrarSalvat,
    incarcaOrarSalvat,
    stergeOrar,
    editeazaDenumire,
    orareFiltrate
  };
};

export default useOrarSalvat;
