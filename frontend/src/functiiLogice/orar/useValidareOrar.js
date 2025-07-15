import { useCallback } from "react";
import Swal from "sweetalert2";

const useValidareOrar = (nivelSelectat, anSelectat, grupe, setRaportValidare) => {
  const valideazaOrarGenerat = useCallback((orarGenerat) => {
  const cursuriProblema = [];
  const lipsuri = [];
  let totalActivitati = 0;
  let activitatiCorecte = 0;
  let laboratoareValide = 0;
  let laboratoareTotale = 0;

  const grupeAnCurent = grupe.filter(
    (g) => g.nivel === nivelSelectat && g.an === anSelectat
  );


  const activitatiDeSincronizat = {
    curs: {},
    seminar: {},
    proiect: {},
  };

  const capitalize = (str) =>
    str.split(" ").map(s => s[0]?.toUpperCase() + s.slice(1)).join(" ");

  // 🧠 Colectăm cursuri, seminarii și proiecte
  grupeAnCurent.forEach((g) => {
    if (!g.grupa) {
      g.grupa = g.denumire.slice(0, -1); // deducem grupa (ex: LI1a → LI1)
    }
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
            grupa_logica: {
              curs: g.an,
              seminar: g.grupa,
              proiect: g.grupa
            }[tip],
            zi,
            interval,
            sala: activ.sala
          });
        }
      });
    });
  });

  // ✅ Verificare sincronizare pe an / grupă
  Object.entries(activitatiDeSincronizat).forEach(([tipActivitate, activitati]) => {
    Object.entries(activitati).forEach(([cheie, aparitii]) => {
      const [nume, prof] = cheie.split("|").map(capitalize);

      const grupate = {};

      aparitii.forEach((a) => {
        const grup = a.grupa_logica;
        if (!grupate[grup]) grupate[grup] = [];
        grupate[grup].push(a);
      });

      Object.entries(grupate).forEach(([grup, lista]) => {
        const ref = lista[0];
        const nesincronizate = lista.filter(
          (a) =>
            a.zi !== ref.zi ||
            a.interval !== ref.interval ||
            a.sala !== ref.sala
        );

        const grupeGasite = new Set(lista.map(a => a.grupa));
        const grupeCorecte = grupeAnCurent
          .filter((g) => {
            const refVal = {
              curs: g.an,
              seminar: g.grupa,
              proiect: g.grupa
            }[tipActivitate];
            return refVal === grup;
          })
          .map((g) => g.denumire);

        const grupeLipsa = grupeCorecte.filter(gr => !grupeGasite.has(gr));

        if (grupeLipsa.length > 0) {
          cursuriProblema.push(`❌ ${tipActivitate} ${nume} – ${prof} lipsește din: ${grupeLipsa.join(", ")}`);
        }

        if (nesincronizate.length > 0) {
          cursuriProblema.push(`❌ ${tipActivitate} ${nume} – ${prof} NU este sincronizat în: ${nesincronizate.map(n => n.grupa).join(", ")}`);
        }
      });
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

  // ✅ Verificare suprapuneri laboratoare
  const eroriLaboratoare = [];
  const subgrupeLaborator = grupeAnCurent.filter(g => g.subgrupa);
  const sloturiLaborator = {};

  subgrupeLaborator.forEach((g) => {
    const orarGrupa = orarGenerat[nivelSelectat]?.[g.denumire] || {};
    Object.entries(orarGrupa).forEach(([zi, intervale]) => {
      Object.entries(intervale).forEach(([interval, activ]) => {
        if (activ?.tip?.toLowerCase() === "laborator") {
          const cheie = `${activ.activitate}|${activ.profesor}`.toLowerCase();
          if (!sloturiLaborator[cheie]) sloturiLaborator[cheie] = [];
          sloturiLaborator[cheie].push({
            grupa: g.denumire,
            zi,
            interval,
            sala: activ.sala
          });
        }
      });
    });
  });

  Object.entries(sloturiLaborator).forEach(([cheie, aparitii]) => {
    laboratoareTotale += aparitii.length;
    const combinatiiUnice = new Set(aparitii.map(a => `${a.zi}-${a.interval}`));

    if (combinatiiUnice.size === aparitii.length) {
      laboratoareValide += aparitii.length;
    } else {
      const grupeConflict = aparitii.map(a => a.grupa).join(", ");
      const [disciplina, prof] = cheie.split("|").map(capitalize);
      eroriLaboratoare.push(`❌ Laboratorul ${disciplina} – ${prof} este programat simultan pentru: ${grupeConflict}`);
    }
  });


  // ✅ Verificare suprapuneri și duplicări pentru curs/seminar/proiect
const eroriActivitati = {
  seminar: [],
  proiect: []
};

["seminar", "proiect"].forEach((tipActivitate) => {
  const activitati = activitatiDeSincronizat[tipActivitate] || {};

  Object.entries(activitati).forEach(([cheie, aparitii]) => {
    // grupare pe GRUPĂ (ex: 1, 2, 3)
    const sloturiPerGrupa = {};

    aparitii.forEach((a) => {
      const grupaObj = grupe.find(g => g.denumire === a.grupa);
      const grupa = grupaObj ? grupaObj.grupa : "?";

      if (!sloturiPerGrupa[grupa]) sloturiPerGrupa[grupa] = {};
      if (!sloturiPerGrupa[grupa][a.subgrupa]) sloturiPerGrupa[grupa][a.subgrupa] = new Set();

      sloturiPerGrupa[grupa][a.subgrupa].add(`${a.zi}|${a.interval}`);
    });

    // verificăm pentru fiecare GRUPĂ dacă toate subgrupele au aceleași sloturi
    Object.entries(sloturiPerGrupa).forEach(([grupa, subgrupeSlots]) => {
      const sloturiArray = Object.values(subgrupeSlots).map(s => Array.from(s).sort().join(","));
      const toateLaFel = sloturiArray.every(s => s === sloturiArray[0]);

      if (!toateLaFel) {
        const subgrupeInfo = Object.entries(subgrupeSlots)
          .map(([subgrupa, slots]) => `${subgrupa}: [${Array.from(slots).join(", ")}]`)
          .join("; ");
        
        eroriActivitati[tipActivitate].push(
          `❌ ${capitalize(tipActivitate)} ${cheie} NU este sincronizat pe grupă ${grupa}: ${subgrupeInfo}`
        );
      }
    });
  });
});


  // 📊 Rezultat final
// ⚠️ Considerăm activități invalide dacă există orice erori
const areErori = cursuriProblema.length > 0 || eroriLaboratoare.length > 0 || lipsuri.length > 0;

const totalActivitatiFinal = totalActivitati + laboratoareTotale;
let activitatiCorecteFinal = activitatiCorecte + laboratoareValide;

// Dacă există erori semnificative, nu putem spune că sunt toate valide
if (areErori) {
  activitatiCorecteFinal -= (cursuriProblema.length + eroriLaboratoare.length + lipsuri.length);

  // Prevenim rezultat negativ
  if (activitatiCorecteFinal < 0) {
    activitatiCorecteFinal = 0;
  }
}


const procent = totalActivitatiFinal > 0
  ? Math.round((activitatiCorecteFinal / totalActivitatiFinal) * 100)
  : 0;


  let mesaj = `📊 Acuratețe estimată: ${procent}% (${activitatiCorecteFinal} / ${totalActivitatiFinal} activități valide)\n\n`;

  mesaj += `📘 Verificare sincronizare:\n${
    cursuriProblema.length === 0
      ? "✅ Cursuri, seminare și proiecte sunt sincronizate"
      : cursuriProblema.join("\n")
  }\n\n`;

mesaj += `📚 Verificare seminarii/proiecte:\n`;

[ "seminar", "proiect"].forEach((tip) => {
  mesaj += eroriActivitati[tip].length === 0
    ? `✅ Nicio problemă la ${tip}e\n\n`
    : eroriActivitati[tip].join("\n") 
});


  mesaj += `🧪 Verificare laboratoare:\n${
    eroriLaboratoare.length === 0
      ? "✅ Laboratoarele sunt distribuite corect între subgrupe"
      : eroriLaboratoare.join("\n")
  }\n\n`;

  mesaj += `📋 Verificare completitudine:\n${
    lipsuri.length === 0
      ? "✅ Toate grupele au cele 4 tipuri de activități"
      : lipsuri.join("\n")
  }`;

  setRaportValidare(mesaj.trim());

  return {
    procent,
    mesaj: mesaj.trim(),
    erori: {
      cursuriProblema,
      eroriLaboratoare,
      lipsuri
    }
  };

}, [nivelSelectat, anSelectat, grupe, setRaportValidare]);

  return { valideazaOrarGenerat };
};

export default useValidareOrar;
