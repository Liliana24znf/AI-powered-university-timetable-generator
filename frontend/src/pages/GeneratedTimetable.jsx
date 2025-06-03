import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2"; // pentru prompt elegant
const GeneratedTimetable = () => {
  const [orar, setOrar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profesori, setProfesori] = useState([]);
  const [sali, setSali] = useState([]);
  const [grupe, setGrupe] = useState([]);
  const location = useLocation();
  const {
  regula_id,
  denumire: denumireRegulaSelectata,
  continut: continutRegula,
  orar_id_selectat, // 👈 Adaugă acest rând
} = location.state || {};

const [nivelSelectat, setNivelSelectat] = useState("Licenta");
const [orareSalvate, setOrareSalvate] = useState([]);
const [esteOrarSalvat, setEsteOrarSalvat] = useState(false);

  const [anSelectat, setAnSelectat] = useState("");
const [grupaSelectata, setGrupaSelectata] = useState("");
const [raportValidare, setRaportValidare] = useState("");


const toateGrupele = nivelSelectat && orar?.[nivelSelectat]
  ? Object.keys(orar[nivelSelectat])
  : [];

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



const [reguli, setReguli] = useState("");

useEffect(() => {
  if (continutRegula) {
    setReguli(continutRegula);
  }
}, [continutRegula]);



  const genereazaOrar = async () => {
    setLoading(true);

const instructiuniProfesori = profesori.map((p) => {
  const discipline = Array.isArray(p.discipline) && p.discipline.length > 0
    ? p.discipline.join(", ")
    : "fără discipline";

  return `- ${p.nume} (${discipline})`;
}).join("\n");


    const instructiuniSali = `Folosește DOAR următoarele coduri de săli, exact așa cum sunt scrise mai jos:\n` +
  sali.map((s) => `- ${s.cod} (${s.tip})`).join("\n") +
  `\nNu inventa denumiri de săli. Afișează DOAR codul (ex: GC101).`;

const instructiuniGrupe = grupe
  .filter(
    (gr) =>
      gr.nivel === nivelSelectat &&
      gr.an === anSelectat
  )
  .map(
    (gr) =>
      `- ${gr.denumire} (${gr.nivel}, anul ${gr.an}, grupa ${gr.grupa}, subgrupa ${gr.subgrupa})`
  )
  .join("\n");


const instructiuniGPT = `NU include chei precum "luni", "marti", etc. la nivel global. Toate activitățile trebuie să fie plasate exclusiv în interiorul structurii de grupe/subgrupe, sub Licenta și Master.
🔒 REGULI GPT – REPARTIZARE SĂLI ȘI SINCRONIZARE ACTIVITĂȚI:

1. 🧠 **Cursurile**:
   - Cursurile sunt comune pentru întregul **an** (ex: toate grupele MI1a, MI1b).
   - Fiecare curs trebuie să apară **exact în același interval orar**, în **aceeași zi**, cu **același profesor** și în **aceeași sală**, pentru toate grupele acelui an.
   - NU este permis ca același curs să fie în momente diferite pentru grupe diferite.
   - Se folosesc exclusiv săli cu prefix **GC**.

2. **Seminarele și proiectele**:
   - Se desfășoară cu **fiecare grupă** în parte.
   - Fiecare grupă are seminarul sau proiectul propriu, programat într-un **singur interval orar**, într-o **singură sală**.
   - NU se suprapun seminarele/proiectele între grupe dacă au același profesor.
   - Seminarele se țin doar în săli cu prefix **GS**.
   - Proiectele se țin doar în săli cu prefix **GP**.

3. **Laboratoarele**:
   - Se desfășoară cu **fiecare subgrupă**.
   - Trebuie programate în **intervale orare diferite** și, preferabil, în **săli diferite**, pentru a evita conflictele.
   - Se țin exclusiv în săli cu prefix **GL**.
   - NU se suprapun laboratoarele între subgrupe dacă au același profesor sau sală.

4. **Condiții suplimentare pentru săli**:
   - O sală **NU poate fi folosită simultan** în același interval orar de mai multe activități, indiferent de nivel, grupă sau tip.
   - O sală **NU poate fi alocată** în același timp la **licență și master**.

‼️ IMPORTANT:
- Respectă strict corespondența între tipul activității și prefixul sălii:  
  - Curs → GC  
  - Seminar → GS  
  - Proiect → GP  
  - Laborator → GL

NU folosi array-uri pentru activități. Fiecare interval este un obiect.
{
  "Licenta": {
    "LI1a": {
      "Luni": {
        "08:00–10:00": {
          "activitate": "Algoritmi (AL)",
          "tip": "Curs",
          "profesor": "Maria Ionescu",
          "sala": "GC1"
        }
      },
      ...
    }
  },
  
}
6. Cursurile se țin cu întregul an și trebuie să apară **simultan** (aceeași zi, oră, sală, profesor) pentru toate grupele din acel an.

7. Seminarele și proiectele se țin cu GRUPA. Ele pot apărea în **zile și intervale orare diferite între grupe**, dar NU pot fi susținute simultan de același profesor la grupe diferite.

8. Laboratoarele se țin cu SUBGRUPA. Ele pot apărea **independent** (altă zi, altă oră) și nu trebuie să fie identice între grupe.

9. Grupele nu trebuie să aibă activități în aceleași intervale orare. Este permis ca o grupă să aibă 4 activități luni, iar alta doar 2. Regula de 4–8 ore/zi/grupă se aplică individual.

10. Fiecare orar generat trebuie să includă toate cele 4 tipuri de activități:
   - cel puțin 1 Curs (cu anul)
   - cel puțin 1 Seminar (cu grupa)
   - cel puțin 1 Proiect (cu grupa)
   - cel puțin 1 Laborator (cu subgrupa)
   Distribuie-le pe parcursul săptămânii pentru fiecare grupă/subgrupă.



`; 


const promptFinal = `
🔒 GENEREAZĂ EXCLUSIV pentru nivelul: ${nivelSelectat}, anul: ${anSelectat}.
NU include alte niveluri. NU omite seminare sau laboratoare.



🔒 GENEREAZĂ DOAR PENTRU NIVELUL: **${nivelSelectat}**, anul: **${anSelectat}**.
‼️ NU include date din alt nivel. Dacă este Master, NU include Licență.

✅ LISTA COMPLETĂ de profesori și discipline (nu inventa altele):
${instructiuniProfesori}

🏫 Săli disponibile:
${instructiuniSali}

👥 Grupe selectate (${nivelSelectat}, anul ${anSelectat}):
${instructiuniGrupe}


🔒 INSTRUCȚIUNI STRICTE PENTRU GPT – FORMAT ȘI RESTRICȚII:
${instructiuniGPT}

Regula ID: ${regula_id || "N/A"}

📜 Conținutul regulii:
${continutRegula || "Nicio regulă definită"}




`;
console.log("🎯 PROMPT GPT:\n", promptFinal);

try {
  const response = await fetch("http://127.0.0.1:5000/genereaza_orar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
  regula_id: regula_id,
  an_selectat: anSelectat,
  nivel_selectat: nivelSelectat,
  grupe_selectate: grupe
    .filter(g => g.an === anSelectat && g.nivel === nivelSelectat)
    .map(g => g.denumire),
    prompt: promptFinal
}),

  });

  const data = await response.json();

  try {
    // Validare JSON (opțională)
    JSON.stringify(data);
    setOrar(data);
    valideazaOrarGenerat(data);

    setEsteOrarSalvat(false); // 👈 dezactivează indicatorul

    // Salvează automat în baza de date
try {
  await fetch("http://127.0.0.1:5000/salveaza_orar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nivel: nivelSelectat,
      an: anSelectat,
      orar: data
    })
  });
} catch (err) {
  console.error("Eroare la salvarea orarului:", err);
}

  } catch (err) {
    console.error("Răspunsul nu este JSON valid:", err);
  }

} catch (error) {
  console.error("Eroare la generare orar:", error);
}

    setLoading(false);
  };


  const zileOrdine = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];

const exportExcel = () => {
  if (!orar) return;
  const wb = XLSX.utils.book_new();

  for (const nivel in orar) {
    for (const an in orar[nivel]) {
      const data = [];

      for (const zi in orar[nivel][an]) {
        const activitati = orar[nivel][an][zi];

        for (const interval in activitati) {
          const item = activitati[interval];

          data.push({
            Nivel: nivel,
            An: an,
            Zi: zi,
            Interval: interval,
            Disciplina: item?.activitate || "", // dacă este string simplu
            Tip: item?.tip || "",                // dacă ai separat tipul
            Profesor: item?.profesor || "",
            Sala: item?.sala || ""
          });
        }
      }

      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, `${nivel}-${an}`);
    }
  }

  XLSX.writeFile(wb, "orar.xlsx");
};

const exportPDF = () => {
  if (!orar) return;
  const element = document.getElementById("orar-afisat");

  const optiuni = {
    margin: [0.3, 0.3, 0.3, 0.3],
    filename: "orar.pdf",
    image: { type: "jpeg", quality: 1 },
    html2canvas: {
      scale: 2.5,
      useCORS: true,
      scrollY: 0
    },
    jsPDF: {
      unit: "mm",
      format: "a3", // A3 pentru lățime mai mare
      orientation: "landscape"
    },
    pagebreak: {
      mode: ["avoid-all", "css", "legacy"]
    }
  };

  html2pdf()
    .set(optiuni)
    .from(element)
    .save();
};


const grupeFiltrate = grupe.filter((g) => g.an === anSelectat);




const denumiriGrupeAnCurent = grupe
  .filter(g => g.an === anSelectat)
  .map(g => g.denumire);

const grupeAnCurent = grupe
  .filter((g) => g.an === anSelectat && g.nivel === nivelSelectat)
  .map((g) => g.denumire);


const renderOrar = () => {
  if (!orar) return null;

  const zileOrdine = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];

  const getBadgeClass = (tipActivitate) => {
    if (!tipActivitate) return "bg-secondary";
    if (tipActivitate.toLowerCase().includes("curs")) return "bg-info";
    if (tipActivitate.toLowerCase().includes("laborator")) return "bg-success";
    if (tipActivitate.toLowerCase().includes("seminar")) return "bg-warning";
    return "bg-secondary";
  };

  return (
    <div className="table-responsive" id="orar-afisat">
      {Object.entries(orar).map(([nivel, grupeOrar]) => (
        <div key={nivel}>
          <h2 className="text-primary fw-bold">{nivel}</h2>
          {Object.entries(grupeOrar).map(([denumireGrupa, zile]) => {
            const intervale = new Set();
            zileOrdine.forEach((zi) => {
              const ziData = zile[zi];
              if (ziData) {
                Object.keys(ziData).forEach((interval) => intervale.add(interval));
              }
            });

            const intervaleSortate = Array.from(intervale).sort();

            return (
              <div key={`${nivel}-${denumireGrupa}`} className="mb-4 page-break">
                <h4>📘 {nivel} – {denumireGrupa}</h4>
                <table className="table table-bordered text-center align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Interval</th>
                      {zileOrdine.map((zi) => (
                        <th key={zi}>{zi}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {intervaleSortate.map((interval) => (
                      <tr key={interval}>
                        <td><strong>{interval}</strong></td>
                        {zileOrdine.map((zi) => {
                          const activitate = zile[zi]?.[interval];
                          return (
                            <td key={`${zi}-${interval}`}>
                              {activitate ? (
                                typeof activitate === "object" ? (
                                  <>
                                    <span className={`badge ${getBadgeClass(activitate.tip)} mb-1`}>
                                      {activitate.activitate}
                                    </span>
                                    <div>{activitate.profesor}</div>
                                    <div className="text-muted">{activitate.sala}</div>
                                  </>
                                ) : (
                                  <span className="badge bg-secondary">{activitate}</span>
                                )
                              ) : (
                                "-"
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};





const aniDisponibili = Array.from(
  new Set(grupe.filter(g => g.nivel === nivelSelectat).map((g) => g.an))
).sort();


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



const valideazaOrarGenerat = (orarGenerat) => {
  const cursuriProblema = [];
  const lipsuri = [];
  let totalActivitati = 0;
  let activitatiCorecte = 0;

  const grupeAnCurent = grupe.filter(
    (g) => g.nivel === nivelSelectat && g.an === anSelectat
  );
  const toateGrupele = grupeAnCurent.map(g => g.denumire);

  const activitatiDeSincronizat = {
    curs: {},
    seminar: {},
    proiect: {},
  };

  // 🧠 Colectăm cursuri, seminarii și proiecte
  grupeAnCurent.forEach((g) => {
    const orarGrupa = orarGenerat[nivelSelectat]?.[g.denumire] || {};
    Object.entries(orarGrupa).forEach(([zi, intervale]) => {
      Object.entries(intervale).forEach(([interval, activ]) => {
        const tip = activ?.tip?.toLowerCase();
        if (!tip) return;

        totalActivitati++;
        activitatiCorecte++;

        if (["curs", "seminar", "proiect"].includes(tip)) {
          const cheie = `${activ.activitate.trim().toLowerCase()}|${activ.profesor.trim().toLowerCase()}`;
          if (!activitatiDeSincronizat[tip][cheie]) activitatiDeSincronizat[tip][cheie] = [];
          activitatiDeSincronizat[tip][cheie].push({
            grupa: g.denumire,
            zi,
            interval,
            sala: activ.sala
          });
        }
      });
    });
  });

  // ✅ Verificare sincronizare curs/seminar/proiect
  Object.entries(activitatiDeSincronizat).forEach(([tipActivitate, activitati]) => {
    Object.entries(activitati).forEach(([cheie, aparitii]) => {
      const ref = aparitii[0];
      const grupeGasite = new Set(aparitii.map(a => a.grupa));
      const grupeLipsa = toateGrupele.filter(gr => !grupeGasite.has(gr));

      const nesincronizate = aparitii.filter(
        (a) => a.zi !== ref.zi || a.interval !== ref.interval || a.sala !== ref.sala
      );

      const [nume, prof] = cheie.split("|").map(s => s[0].toUpperCase() + s.slice(1));

      if (grupeLipsa.length > 0) {
        cursuriProblema.push(`❌ ${tipActivitate.charAt(0).toUpperCase() + tipActivitate.slice(1)} ${nume} – ${prof} lipsește din grupele: ${grupeLipsa.join(", ")}`);
      }
      if (nesincronizate.length > 0) {
        cursuriProblema.push(`❌ ${tipActivitate.charAt(0).toUpperCase() + tipActivitate.slice(1)} ${nume} – ${prof} NU este sincronizat între grupele: ${nesincronizate.map(n => n.grupa).join(", ")}`);
      }
    });
  });

  // 🔍 Verificare lipsuri per grupă
  grupeAnCurent.forEach((g) => {
    const orarGrupa = orarGenerat[nivelSelectat]?.[g.denumire] || {};
    const tipuriGasite = new Set();

    Object.values(orarGrupa).forEach((intervale) => {
      Object.values(intervale).forEach((activ) => {
        if (activ?.tip) {
          tipuriGasite.add(activ.tip.toLowerCase());
        }
      });
    });

    const necesare = ["curs", "seminar", "proiect", "laborator"];
    necesare.forEach((t) => {
      if (!tipuriGasite.has(t)) {
        lipsuri.push(`❌ Grupa ${g.denumire} nu are activitate de tip ${t}`);
      }
    });
  });

  const procent = Math.round((activitatiCorecte / (totalActivitati || 1)) * 100);

  const mesaj = `
📊 Acuratețe estimată: ${procent || 0}% (${activitatiCorecte} / ${totalActivitati} activități valide)
${cursuriProblema.length === 0 ? "✅ Cursuri, seminarii și proiecte sunt sincronizate" : cursuriProblema.join("\n")}
${lipsuri.length === 0 ? "✅ Toate grupele au cele 4 tipuri de activități" : lipsuri.join("\n")}
  `.trim();

  setRaportValidare(mesaj);
};



  return (
   <div className="container-fluid pt-4 px-4">
{/* NAVBAR */}
      <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3 mb-4">
        <div className="container-fluid position-relative d-flex justify-content-center align-items-center">
    
    {/* Stânga: Logo */}
    <span className="position-absolute start-0 navbar-brand fw-bold text-primary fs-4">
      Generator Orare
    </span>

    {/* Centru: Titlu */}
   <span className="text-primary fw-bold fs-4">
      📅 Orar Generat
    </span>

    {/* Dreapta: Butoane */}
    <div className="position-absolute end-0 d-flex">
      <button className="btn btn-outline-primary me-2" onClick={exportExcel}>
        ⬇ Export Excel
      </button>
      <button className="btn btn-outline-primary me-2" onClick={exportPDF}>
        🖨️ Export PDF
      </button>
    </div>
  </div>
</nav>



<div className="container mb-4">
  <div className="card shadow-sm border-0 bg-light">
    <div className="card-body">
      <p className="mb-2">
        <strong>🔍 Informații:</strong> Această pagină afișează orarul generat pentru studenți, incluzând profesori și săli disponibile.
      </p>
      <p className="mb-0">
        <strong>ℹ️ Notă:</strong> Asigură-te că ai introdus toate regulile și informațiile necesare pentru generarea orarului.
      </p>
    </div>
  </div>
</div>


<div className="d-flex align-items-center mb-4 gap-3">
<label className="me-2 fw-semibold text-primary">🎯 Selectează anul:</label>
<select
  className="form-select w-auto me-3"
  value={anSelectat}
  onChange={(e) => setAnSelectat(e.target.value)}
>
  <option value="" disabled>-- Selectează anul --</option>
  {aniDisponibili.map((an, idx) => (
    <option key={idx} value={an}>
      {an}
    </option>
  ))}
</select>

<label className="me-2 fw-semibold text-primary">🏫 Selectează nivelul:</label>
<select
  className="form-select w-auto me-3"
  value={nivelSelectat}
  onChange={(e) => setNivelSelectat(e.target.value)}
>
  <option value="Licenta">Licență</option>
  <option value="Master">Master</option>
</select>






        <button
          className="btn btn-success"
          onClick={genereazaOrar}
          disabled={loading}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Se generează...
            </>
          ) : (
            "🚀 Generează orar"
          )}
        </button>
      </div>

{esteOrarSalvat && (
  <div className="alert alert-warning d-flex align-items-center gap-2">
    <i className="bi bi-info-circle-fill fs-5"></i>
    <span>
      Orarul afișat provine dintr-o <strong>salvare anterioară</strong>.
    </span>
    <button
      className="btn btn-sm btn-outline-secondary ms-auto"
      onClick={() => {
        setOrar(null);
        setEsteOrarSalvat(false);
      }}
    >
      ❌ Golește orarul
    </button>
  </div>
)}



{renderOrar()}

{raportValidare && (
  <div className="alert alert-info mt-4" style={{ whiteSpace: "pre-wrap" }}>
    <strong>📋 Raport de validare orar:</strong>
    <br />
    {raportValidare}
  </div>
)}


<div className="card shadow-sm border-0 mt-5">
  <div className="card-header bg-light fw-bold text-primary">
    📂 Orare salvate anterior
  </div>
  <div className="card-body p-0">
    {orareSalvate.length === 0 ? (
      <p className="text-muted p-3 mb-0">Nu există orare salvate în sistem.</p>
    ) : (
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        <ul className="list-group list-group-flush">
          {orareSalvate.map((orar) => (
            <li
              key={orar.id}
              className="list-group-item d-flex justify-content-between align-items-start flex-wrap"
            >
              <div className="me-auto">
                <div className="fw-semibold text-dark">
  📘 {orar.nume ? orar.nume : `${orar.nivel} – ${orar.an}`}
</div>

                <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                  {new Date(orar.data_creare).toLocaleString("ro-RO", {
                    timeZone: "UTC",
                    hour12: false,
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
              </div>
                    <button
        className="btn btn-sm btn-outline-success"
        onClick={() => editeazaDenumire(orar.id, orar.nume)}
      >
        ✏️ Editează
      </button>

              <div className="d-flex gap-2 mt-2 mt-sm-0">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => incarcaOrarSalvat(orar.id)}
                >
                  🔄 Încarcă
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => stergeOrar(orar.id)}
                >
                  🗑️ Șterge
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
</div>



{/*}
{regula_id && continutRegula && (
  <div
    className="card shadow-sm border-0"
    style={{
      fontSize: "0.85rem",
      marginTop: "0.5rem",
      maxWidth: "500px", // opțional, pentru a-l face mai îngust
    }}
  >

      {regula_id && denumireRegulaSelectata && (
  <div className="alert alert-info d-flex justify-content-between align-items-center mt-3">
    <div>
      <i className="bi bi-check-circle-fill me-2 text-primary"></i>
      <strong>Regulă selectată:</strong> <em>{denumireRegulaSelectata}</em>
    </div>
    <span className="badge bg-primary text-white">ID: {regula_id}</span>
  </div>
)}


    <div
      className="card-header bg-light fw-bold text-primary py-1 px-2"
      style={{ fontSize: "0.9rem" }}
    >
      📜 Conținutul regulii selectate
    </div>
    <div
      className="card-body py-2 px-2"
      style={{
        whiteSpace: "pre-wrap",
        fontFamily: "monospace",
        backgroundColor: "#f8f9fa",
        fontSize: "0.8rem",
        lineHeight: "1.3",
      }}
    >
      {continutRegula}
    </div>
  </div>
)}
*/}


  
      {/* FOOTER */}
      <footer className="bg-white text-center text-muted py-3 border-top mt-auto">
        <p className="mb-0">© {new Date().getFullYear()} Generator Orare</p>
      </footer>
    </div>
  );
  
};

export default GeneratedTimetable;