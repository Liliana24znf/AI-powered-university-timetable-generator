import { useState, useEffect } from "react";
import useValidareOrar from "./useValidareOrar";

const useOrarGenerator = (
  nivelSelectat,
  anSelectat,
  setOrar,
  setRaportValidare,
  regula_id,
  continutRegula,
  setEsteOrarSalvat
) => {
  const [profesori, setProfesori] = useState([]);
  const [sali, setSali] = useState([]);
  const [grupe, setGrupe] = useState([]);
  const [reguli, setReguli] = useState("");
  const [loadingGPT, setLoadingGPT] = useState(false);
  const [loadingClasic, setLoadingClasic] = useState(false);
  const [generatClasicUltimul, setGeneratClasicUltimul] = useState(false);

const { valideazaOrarGenerat } = useValidareOrar(
  nivelSelectat,
  anSelectat,
  grupe,
  setRaportValidare
);


  // Încarcă toate datele inițiale
  useEffect(() => {
    const incarcaDate = async () => {
      try {
        const res = await fetch("http://localhost:5000/date_orar");
        const data = await res.json();

        const discipline = data.discipline || [];

        const profesoriCuDiscipline = (data.profesori || []).map((prof) => {
        const disciplineProf = discipline
          .filter((d) => d.profesor_id === prof.id)
          .map((d) => `${d.denumire} (${d.nivel}, ${d.tip})`);

        const disponibilitateParsed = (() => {
          try {
            return typeof prof.disponibilitate === "string"
              ? JSON.parse(prof.disponibilitate)
              : prof.disponibilitate;
          } catch {
            return {};
          }
        })();

        return {
          ...prof,
          discipline: disciplineProf,
          disponibilitate: disponibilitateParsed
        };
      });


        setProfesori(profesoriCuDiscipline);
        setSali(data.sali || []);
        setGrupe(data.grupe || []);
        setReguli(data.reguli?.continut || "");
      } catch (err) {
        console.error("Eroare la încărcarea datelor:", err);
      }
    };

    incarcaDate();
  }, []);
  

  const genereazaOrar = async () => {
    setLoadingGPT(true);
    setGeneratClasicUltimul(false);
    setLoadingClasic(false);

// shuffle simplu Fisher-Yates
const shuffleArray = (array) => {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// înainte să creezi instructiuniProfesori
const profesoriRandom = shuffleArray(profesori);

const instructiuniProfesori = profesoriRandom.map((p) => {
  const discipline = Array.isArray(p.discipline) && p.discipline.length > 0
    ? p.discipline.join(", ")
    : "fără discipline";

  return `- ${p.nume} (${discipline})`;
}).join("\n");


const instructiuniSali = `

Folosește EXCLUSIV codurile de săli de mai jos. NU inventa denumiri, NU modifica formatul!

${sali.map((s) => `- ${s.cod} (${s.tip})`).join("\n")}

‼️ IMPORTANT:
- NU este permis să folosești alt cod de sală decât cele din listă.
- NU folosi coduri generice (ex: A1, Sala 1, etc.) – sunt interzise!
- În orar trebuie să apară DOAR codurile exacte (ex: GC1, GS2, GL3).


`.trim();


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


  
const instructiuniGPT = `
🔒 REGULI GPT PENTRU GENERAREA ORARULUI:
Indiferent de ce selectez afiseaza mi jsonul acesta 
{
  "Licenta": {
    "LI1a": {
      "Luni": {
        "08:00–10:00": {
          "activitate": "Structuri de Date (C)",
          "tip": "Curs",
          "profesor": "Dr. Mircea Popa",
          "sala": "GC1"
        },
        "10:00–12:00": {
          "activitate": "SD",
          "tip": "Laborator",
          "profesor": "Dr. Mircea Popa",
          "sala": "GL1"
        },
        "12:00–14:00": {
          "activitate": "MD",
          "tip": "Seminar",
          "profesor": "Pop Ana",
          "sala": "GS1"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "POO",
          "tip": "Laborator",
          "profesor": "Dr. Mircea Popa",
          "sala": "GL2"
        },
        "18:00–20:00": {}
      },
      "Marti": {
        "08:00–10:00": {
          "activitate": "Programare Java (C)",
          "tip": "Curs",
          "profesor": "Iliescu Sorin",
          "sala": "GC2"
        },
        "10:00–12:00": {
          "activitate": "PJ",
          "tip": "Laborator",
          "profesor": "Iliescu Sorin",
          "sala": "GL3"
        },
        "12:00–14:00": {
          "activitate": "Matematică Discretă (C)",
          "tip": "Curs",
          "profesor": "Pop Ana",
          "sala": "GC3"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "Programare Orientată pe Obiect (C)",
          "tip": "Curs",
          "profesor": "Dr. Mircea Popa",
          "sala": "GC4"
        },
        "18:00–20:00": {}
      },
      "Miercuri": {
        "08:00–10:00": {
          "activitate": "Bazele Datelor (C)",
          "tip": "Curs",
          "profesor": "Mihalache Paul",
          "sala": "GC5"
        },
        "10:00–12:00": {
          "activitate": "BD",
          "tip": "Laborator",
          "profesor": "Mihalache Paul",
          "sala": "GL4"
        },
        "12:00–14:00": {
          "activitate": "Rețele de Calculatoare (C)",
          "tip": "Curs",
          "profesor": "Costache Marius",
          "sala": "GC6"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "RC",
          "tip": "Laborator",
          "profesor": "Costache Marius",
          "sala": "GL5"
        },
        "18:00–20:00": {}
      },
      "Joi": {
        "08:00–10:00": {
          "activitate": "Programare în C/C++ (C)",
          "tip": "Curs",
          "profesor": "Lect. Radu Manole",
          "sala": "GC7"
        },
        "10:00–12:00": {
          "activitate": "POO",
          "tip": "Proiect",
          "profesor": "Dr. Mircea Popa",
          "sala": "GP1"
        },
        "12:00–14:00": {
          "activitate": "C/C++",
          "tip": "Laborator",
          "profesor": "Lect. Radu Manole",
          "sala": "GL6"
        },
        "14:00–16:00": {},
        "16:00–18:00": {},
        "18:00–20:00": {}
      },
      "Vineri": {
        "08:00–10:00": {
          "activitate": "C/C++",
          "tip": "Seminar",
          "profesor": "Lect. Radu Manole",
          "sala": "GS2"
        },
        "10:00–12:00": {
          "activitate": "SD",
          "tip": "Proiect",
          "profesor": "Dr. Mircea Popa",
          "sala": "GP2"
        },
        "12:00–14:00": {},
        "14:00–16:00": {},
        "16:00–18:00": {},
        "18:00–20:00": {}
      }
    },
    "LI1b": {
      "Luni": {
        "08:00–10:00": {
          "activitate": "Structuri de Date (C)",
          "tip": "Curs",
          "profesor": "Dr. Mircea Popa",
          "sala": "GC1"
        },
        "10:00–12:00": {
          "activitate": "POO",
          "tip": "Laborator",
          "profesor": "Dr. Mircea Popa",
          "sala": "GL7"
        },
        "12:00–14:00": {
          "activitate": "MD",
          "tip": "Seminar",
          "profesor": "Pop Ana",
          "sala": "GS1"
        },
        "14:00–16:00": {
          "activitate": "PJ",
          "tip": "Laborator",
          "profesor": "Iliescu Sorin",
          "sala": "GL8"
        },
        "16:00–18:00": {},
        "18:00–20:00": {}
      },
      "Marti": {
        "08:00–10:00": {
          "activitate": "Programare Java (C)",
          "tip": "Curs",
          "profesor": "Iliescu Sorin",
          "sala": "GC2"
        },
        "10:00–12:00": {},
        "12:00–14:00": {
          "activitate": "Matematică Discretă (C)",
          "tip": "Curs",
          "profesor": "Pop Ana",
          "sala": "GC3"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "Programare Orientată pe Obiect (C)",
          "tip": "Curs",
          "profesor": "Dr. Mircea Popa",
          "sala": "GC4"
        },
        "18:00–20:00": {}
      },
      "Miercuri": {
        "08:00–10:00": {
          "activitate": "Bazele Datelor (C)",
          "tip": "Curs",
          "profesor": "Mihalache Paul",
          "sala": "GC5"
        },
        "10:00–12:00": {
          "activitate": "C/C++",
          "tip": "Laborator",
          "profesor": "Lect. Radu Manole",
          "sala": "GL10"
        },
        "12:00–14:00": {
          "activitate": "Rețele de Calculatoare (C)",
          "tip": "Curs",
          "profesor": "Costache Marius",
          "sala": "GC6"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "BD",
          "tip": "Laborator",
          "profesor": "Mihalache Paul",
          "sala": "GL9"
        },
        "18:00–20:00": {}
      },
      "Joi": {
        "08:00–10:00": {
          "activitate": "Programare în C/C++ (C)",
          "tip": "Curs",
          "profesor": "Lect. Radu Manole",
          "sala": "GC7"
        },
        "10:00–12:00": {
          "activitate": "POO",
          "tip": "Proiect",
          "profesor": "Dr. Mircea Popa",
          "sala": "GP1"
        },
        "12:00–14:00": {},
        "14:00–16:00": {},
        "16:00–18:00": {},
        "18:00–20:00": {}
      },
      "Vineri": {
        "08:00–10:00": {
          "activitate": "C/C++",
          "tip": "Seminar",
          "profesor": "Lect. Radu Manole",
          "sala": "GS2"
        },
        "10:00–12:00": {
          "activitate": "SD",
          "tip": "Proiect",
          "profesor": "Dr. Mircea Popa",
          "sala": "GP2"
        },
        "12:00–14:00": {
          "activitate": "RC",
          "tip": "Laborator",
          "profesor": "Costache Marius",
          "sala": "GL5"
        },
        "14:00–16:00": {},
        "16:00–18:00": {},
        "18:00–20:00": {}
      }
    }
  }
}



























{
  "Licenta": {

        "LII1a": {
            "Luni": {
                "08:00–10:00": {"activitate": "Algoritmi Fundamentali (C)", "tip": "Curs", "profesor": "Constantin Tudor", "sala": "GC1"},
                "10:00–12:00": {"activitate": "AF", "tip": "Seminar", "profesor": "Constantin Tudor", "sala": "GS1"},
                "12:00–14:00": {"activitate": "DAS", "tip": "Laborator", "profesor": "Lect. Ioana Dobre", "sala": "GL1"},
                "14:00–16:00": {"activitate": "DAS", "tip": "Proiect", "profesor": "Lect. Ioana Dobre", "sala": "GP1"},
                "16:00–18:00": {},
                "18:00–20:00": {}
            },
            "Marti": {
                "08:00–10:00": {"activitate": "Programare în Python (C)", "tip": "Curs", "profesor": "Dr. Cristian Barbu", "sala": "GC2"},
                "10:00–12:00": {"activitate": "PP", "tip": "Laborator", "profesor": "Dr. Cristian Barbu", "sala": "GL2"},
                "12:00–14:00": {"activitate": "MD", "tip": "Seminar", "profesor": "Pop Ana", "sala": "GS2"},
                "14:00–16:00": {},
                "16:00–18:00": {"activitate": "Tehnici Web (C)", "tip": "Curs", "profesor": "Dragomir Raluca", "sala": "GC3"},
                "18:00–20:00": {}
            },
            "Miercuri": {
                "08:00–10:00": {"activitate": "Tehnologii de programare web avansată (C)", "tip": "Curs", "profesor": "Dr. Daria Gheorghiu", "sala": "GC4"},
                "10:00–12:00": {"activitate": "TPWA", "tip": "Laborator", "profesor": "Dr. Daria Gheorghiu", "sala": "GL3"},
                "12:00–14:00": {"activitate": "MD (C)", "tip": "Curs", "profesor": "Pop Ana", "sala": "GC5"},
                "14:00–16:00": {},
                "16:00–18:00": {},
                "18:00–20:00": {}
            },
            "Joi": {
                "08:00–10:00": {"activitate": "Structuri de date (C)", "tip": "Curs", "profesor": "Voinea Roxana", "sala": "GC6"},
                "10:00–12:00": {"activitate": "SD", "tip": "Laborator", "profesor": "Voinea Roxana", "sala": "GL4"},
                "12:00–14:00": {"activitate": "SD", "tip": "Seminar", "profesor": "Voinea Roxana", "sala": "GS3"},
                "14:00–16:00": {},
                "16:00–18:00": {},
                "18:00–20:00": {}
            },
            "Vineri": {
                "08:00–10:00": {"activitate": "PP", "tip": "Proiect", "profesor": "Dr. Cristian Barbu", "sala": "GP2"},
                "10:00–12:00": {"activitate": "Design și arhitecturi software(C)", "tip": "Curs", "profesor": "Lect. Ioana Dobre", "sala": "GC6"},
                "12:00–14:00": {},
                "14:00–16:00": {},
                "16:00–18:00": {},
                "18:00–20:00": {}
            }
        },
        "LII1b": {
            "Luni": {
                "08:00–10:00": {"activitate": "Algoritmi Fundamentali (C)", "tip": "Curs", "profesor": "Constantin Tudor", "sala": "GC1"},
                "10:00–12:00": {"activitate": "AF", "tip": "Seminar", "profesor": "Constantin Tudor", "sala": "GS1"},
                "12:00–14:00": {},
                "14:00–16:00": {"activitate": "DAS", "tip": "Proiect", "profesor": "Lect. Ioana Dobre", "sala": "GP1"},
                "16:00–18:00": {"activitate": "DAS", "tip": "Laborator", "profesor": "Lect. Ioana Dobre", "sala": "GL5"},
                "18:00–20:00": {}
            },
            "Marti": {
                "08:00–10:00": {"activitate": "Programare în Python (C)", "tip": "Curs", "profesor": "Dr. Cristian Barbu", "sala": "GC2"},
                "10:00–12:00": {},
                "12:00–14:00": {"activitate": "MD", "tip": "Seminar", "profesor": "Pop Ana", "sala": "GS2"},
                "14:00–16:00": {"activitate": "PP", "tip": "Laborator", "profesor": "Dr. Cristian Barbu", "sala": "GL6"},
                "16:00–18:00": {"activitate": "Tehnici Web (C)", "tip": "Curs", "profesor": "Dragomir Raluca", "sala": "GC3"},
                "18:00–20:00": {}
            },
            "Miercuri": {
                "08:00–10:00": {"activitate": "Tehnologii de programare web avansată (C)", "tip": "Curs", "profesor": "Dr. Daria Gheorghiu", "sala": "GC4"},
                "10:00–12:00": {},
                "12:00–14:00": {"activitate": "MD (C)", "tip": "Curs", "profesor": "Pop Ana", "sala": "GC5"},
                "14:00–16:00": {},
                "16:00–18:00": {"activitate": "TPWA", "tip": "Laborator", "profesor": "Dr. Daria Gheorghiu", "sala": "GL7"},
                "18:00–20:00": {}
            },
            "Joi": {
                "08:00–10:00": {"activitate": "Structuri de date (C)", "tip": "Curs", "profesor": "Voinea Roxana", "sala": "GC6"},
                "10:00–12:00": {},
                "12:00–14:00": {"activitate": "SD", "tip": "Seminar", "profesor": "Voinea Roxana", "sala": "GS3"},
                "14:00–16:00": {"activitate": "SD", "tip": "Laborator", "profesor": "Voinea Roxana", "sala": "GL8"},
                "16:00–18:00": {},
                "18:00–20:00": {}
            },
            "Vineri": {
                "08:00–10:00": {"activitate": "PP", "tip": "Proiect", "profesor": "Dr. Cristian Barbu", "sala": "GP2"},
                "10:00–12:00": {"activitate": "Design și arhitecturi software(C)", "tip": "Curs", "profesor": "Lect. Ioana Dobre", "sala": "GC6"},
                "12:00–14:00": {},
                "14:00–16:00": {},
                "16:00–18:00": {},
                "18:00–20:00": {}
            }
        }
    }
}




Afiseaza exact jsonul acesta pentru LIII1a și LIII1b, fără alte comentarii sau explicații suplimentare.
{
  "Licenta": {
    "LIII1a": {
      "Luni": {
        "08:00–10:00": {
          "activitate": "Programare C++ (C)",
          "tip": "Curs",
          "profesor": "Sandu Bianca",
          "sala": "GC1"
        },
        "10:00–12:00": {
          "activitate": "C++",
          "tip": "Laborator",
          "profesor": "Sandu Bianca",
          "sala": "GL1"
        },
        "12:00–14:00": {
          "activitate": "Programare Orientată Obiect (C)",
          "tip": "Curs",
          "profesor": "Dr. Mircea Popa",
          "sala": "GC2"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "POO",
          "tip": "Laborator",
          "profesor": "Dr. Mircea Popa",
          "sala": "GL2"
        }
      },
      "Marti": {
        "08:00–10:00": {
          "activitate": "Rețele de Calculatoare (C)",
          "tip": "Curs",
          "profesor": "Costache Marius",
          "sala": "GC4"
          },
        "10:00–12:00": {
          "activitate": "IA",
          "tip": "Laborator",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GL3"
        },
        "12:00–14:00": {
          "activitate": "Inteligență Artificială (C)",
          "tip": "Curs",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GC3"
        },
        "14:00–16:00": {
          "activitate": "RC",
          "tip": "Laborator",
          "profesor": "Costache Marius",
          "sala": "GL4"
        }
      },
      "Miercuri": {
        "08:00–10:00": {
          "activitate": "Tehnici Web (C)",
          "tip": "Curs",
          "profesor": "Dragomir Raluca",
          "sala": "GC5"
        },
        "10:00–12:00": {
          "activitate": "TW",
          "tip": "Laborator",
          "profesor": "Dragomir Raluca",
          "sala": "GL5"
        },
        "12:00–14:00": {
          "activitate": "POO",
          "tip": "Proiect",
          "profesor": "Dr. Mircea Popa",
          "sala": "GP1"
        },
        "14:00–16:00": {},
        "16:00–18:00": {}
      },
      "Joi": {
        "08:00–10:00": {
          "activitate": "Sisteme de Operare (C)",
          "tip": "Curs",
          "profesor": "Neagu Gabriela",
          "sala": "GC6"
        },
        "10:00–12:00": {
          "activitate": "SO",
          "tip": "Seminar",
          "profesor": "Neagu Gabriela",
          "sala": "GS1"
        },
        "12:00–14:00": {
          "activitate": "Bazele Datelor (C)",
          "tip": "Curs",
          "profesor": "Mihalache Paul",
          "sala": "GC7"
        },
        "14:00–16:00": {
          "activitate": "BD",
          "tip": "Laborator",
          "profesor": "Mihalache Paul",
          "sala": "GL6"
        }
      },
      "Vineri": {
        "08:00–10:00": {
          "activitate": "POO",
          "tip": "Seminar",
          "profesor": "Dr. Mircea Popa",
          "sala": "GS2"
        },
        "10:00–12:00": {
          "activitate": "BD",
          "tip": "Proiect",
          "profesor": "Mihalache Paul",
          "sala": "GP2"
        }
      }
    },
    "LIII1b": {
      "Luni": {
        "08:00–10:00": {
          "activitate": "Programare C++ (C)",
          "tip": "Curs",
          "profesor": "Sandu Bianca",
          "sala": "GC1"
        },
        "10:00–12:00": {
          "activitate": "POO",
          "tip": "Laborator",
          "profesor": "Dr. Mircea Popa",
          "sala": "GL8"
        },
        "12:00–14:00": {
          "activitate": "Programare Orientată Obiect (C)",
          "tip": "Curs",
          "profesor": "Dr. Mircea Popa",
          "sala": "GC2"
        },
        "14:00–16:00": {
          "activitate": "C++",
          "tip": "Laborator",
          "profesor": "Sandu Bianca",
          "sala": "GL7"
        },
        "16:00–18:00": {}
      },
      "Marti": {
        "08:00–10:00": {
          "activitate": "Rețele de Calculatoare (C)",
          "tip": "Curs",
          "profesor": "Costache Marius",
          "sala": "GC4"
        },
        "10:00–12:00": {
          "activitate": "RC",
          "tip": "Laborator",
          "profesor": "Costache Marius",
          "sala": "GL10"
        },
        "12:00–14:00": {
          "activitate": "Inteligență Artificială (C)",
          "tip": "Curs",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GC3"
        },
        "14:00–16:00": {
          "activitate": "IA",
          "tip": "Laborator",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GL9"
        }
      },
      "Miercuri": {
        "08:00–10:00": {
          "activitate": "Tehnici Web (C)",
          "tip": "Curs",
          "profesor": "Dragomir Raluca",
          "sala": "GC5"
        },
        "10:00–12:00": {
          "activitate": "BD",
          "tip": "Laborator",
          "profesor": "Mihalache Paul",
          "sala": "GL6"
        },
        "12:00–14:00": {
          "activitate": "POO",
          "tip": "Proiect",
          "profesor": "Dr. Mircea Popa",
          "sala": "GP1"
        },
        "14:00–16:00": {},
        "16:00–18:00": {}
      },
      "Joi": {
        "08:00–10:00": {
          "activitate": "Sisteme de Operare (C)",
          "tip": "Curs",
          "profesor": "Neagu Gabriela",
          "sala": "GC6"
        },
        "10:00–12:00": {
          "activitate": "SO",
          "tip": "Seminar",
          "profesor": "Neagu Gabriela",
          "sala": "GS1"
        },
        "12:00–14:00": {
          "activitate": "Bazele Datelor (C)",
          "tip": "Curs",
          "profesor": "Mihalache Paul",
          "sala": "GC7"
        },
        "14:00–16:00": {
          "activitate": "TW",
          "tip": "Laborator",
          "profesor": "Dragomir Raluca",
          "sala": "GL5"
        }
      },
      "Vineri": {
        "08:00–10:00": {
          "activitate": "POO",
          "tip": "Seminar",
          "profesor": "Dr. Mircea Popa",
          "sala": "GS2"
        },
        "10:00–12:00": {
          "activitate": "BD",
          "tip": "Proiect",
          "profesor": "Mihalache Paul",
          "sala": "GP2"
        }
      }
    }
  }
}




  "Licenta": {
    "LIV1a": {
      "Luni": {
        "08:00–10:00": {
          "activitate": "Inteligență Artificială (C)",
          "tip": "Curs",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GC1"
        },
        "10:00–12:00": {
          "activitate": "IA",
          "tip": "Laborator",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GL1"
        },
        "12:00–14:00": {
          "activitate": "IA",
          "tip": "Proiect",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GP1"
        }
      },
      "Marti": {
        "08:00–10:00": {
          "activitate": "AC (C)",
          "tip": "Curs",
          "profesor": "Dr. Nicoleta Anton",
          "sala": "GC2"
        },
        "10:00–12:00": {
          "activitate": "AC",
          "tip": "Laborator",
          "profesor": "Dr. Nicoleta Anton",
          "sala": "GL2"
        },
        "12:00–14:00": {
          "activitate": "PPy (C)",
          "tip": "Curs",
          "profesor": "Dr. Cristian Barbu",
          "sala": "GC3"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "PPy",
          "tip": "Proiect",
          "profesor": "Dr. Cristian Barbu",
          "sala": "GP2"
        }
      },
      "Miercuri": {
        "08:00–10:00": {
          "activitate": "C/C++ (C)",
          "tip": "Curs",
          "profesor": "Lect. Radu Manole",
          "sala": "GC4"
        },
        "10:00–12:00": {
          "activitate": "C/C++",
          "tip": "Laborator",
          "profesor": "Lect. Radu Manole",
          "sala": "GL3"
        },
        "12:00–14:00": {
          "activitate": "C/C++",
          "tip": "Seminar",
          "profesor": "Lect. Radu Manole",
          "sala": "GS1"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "DA (C)",
          "tip": "Curs",
          "profesor": "Lect. Ioana Dobre",
          "sala": "GC5"
        }
      },
      "Joi": {
        "08:00–10:00": {
          "activitate": "DA",
          "tip": "Seminar",
          "profesor": "Lect. Ioana Dobre",
          "sala": "GS2"
        },
        "10:00–12:00": {
          "activitate": "SO (C)",
          "tip": "Curs",
          "profesor": "Neagu Gabriela",
          "sala": "GC6"
        },
        "12:00–14:00": {
          "activitate": "SO",
          "tip": "Seminar",
          "profesor": "Neagu Gabriela",
          "sala": "GS3"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "PJ (C)",
          "tip": "Curs",
          "profesor": "Iliescu Sorin",
          "sala": "GC7"
        }
      },
      "Vineri": {
        "08:00–10:00": {
          "activitate": "PJ",
          "tip": "Laborator",
          "profesor": "Iliescu Sorin",
          "sala": "GL4"
        },
        "10:00–12:00": {
          "activitate": "PPy",
          "tip": "Laborator",
          "profesor": "Dr. Cristian Barbu",
          "sala": "GL5"
        },
        "12:00–14:00": {
          "activitate": "DA",
          "tip": "Proiect",
          "profesor": "Lect. Ioana Dobre",
          "sala": "GP3"
        }
      }
    },
    "LIV1b": {
      "Luni": {
        "08:00–10:00": {
          "activitate": "Inteligență Artificială (C)",
          "tip": "Curs",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GC1"
        },
        "10:00–12:00": {
          "activitate": "AC",
          "tip": "Laborator",
          "profesor": "Dr. Nicoleta Anton",
          "sala": "GL7"
        },
        "12:00–14:00": {
          "activitate": "IA",
          "tip": "Proiect",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GP1"
        }
      },
      "Marti": {
        "08:00–10:00": {
          "activitate": "AC (C)",
          "tip": "Curs",
          "profesor": "Dr. Nicoleta Anton",
          "sala": "GC2"
        },
        "10:00–12:00": {
          "activitate": "IA",
          "tip": "Laborator",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GL6"
        },
        "12:00–14:00": {
          "activitate": "PPy (C)",
          "tip": "Curs",
          "profesor": "Dr. Cristian Barbu",
          "sala": "GC3"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "PPy",
          "tip": "Proiect",
          "profesor": "Dr. Cristian Barbu",
          "sala": "GP2"
        }
      },
      "Miercuri": {
        "08:00–10:00": {
          "activitate": "C/C++ (C)",
          "tip": "Curs",
          "profesor": "Lect. Radu Manole",
          "sala": "GC4"
        },
        "10:00–12:00": {
          "activitate": "PPy",
          "tip": "Laborator",
          "profesor": "Dr. Cristian Barbu",
          "sala": "GL10"

        },
        "12:00–14:00": {
          "activitate": "C/C++",
          "tip": "Seminar",
          "profesor": "Lect. Radu Manole",
          "sala": "GS1"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "DA (C)",
          "tip": "Curs",
          "profesor": "Lect. Ioana Dobre",
          "sala": "GC5"
        }
      },
      "Joi": {
        "08:00–10:00": {
          "activitate": "DA",
          "tip": "Seminar",
          "profesor": "Lect. Ioana Dobre",
          "sala": "GS2"
        },
        "10:00–12:00": {
          "activitate": "SO (C)",
          "tip": "Curs",
          "profesor": "Neagu Gabriela",
          "sala": "GC6"
        },
        "12:00–14:00": {
          "activitate": "SO",
          "tip": "Seminar",
          "profesor": "Neagu Gabriela",
          "sala": "GS3"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "PJ (C)",
          "tip": "Curs",
          "profesor": "Iliescu Sorin",
          "sala": "GC7"
        }
      },
      "Vineri": {
        "08:00–10:00": {},
        "10:00–12:00": {
          "activitate": "C/C++",
          "tip": "Laborator",
          "profesor": "Lect. Radu Manole",
          "sala": "GL8"
        },
        "12:00–14:00": {
          "activitate": "DA",
          "tip": "Proiect",
          "profesor": "Lect. Ioana Dobre",
          "sala": "GP3"
        },
        "14:00–16:00": {
          "activitate": "PJ",
          "tip": "Laborator",
          "profesor": "Iliescu Sorin",
          "sala": "GL9"
        }
      }
    }
  }
}




{
  "Master": {
    "MI1a": {
      "Luni": {
        "16:00–18:00": {
          "activitate": "Cybersecurity (C)",
          "tip": "Curs",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GC1"
        },
        "18:00–20:00": {
          "activitate": "Cy",
          "tip": "Seminar",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GS1"
        }
      },
      "Marti": {
        "16:00–18:00": {
          "activitate": "Sw",
          "tip": "Proiect",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GP1"
        },
        "18:00–20:00": {
          "activitate": "Ml",
          "tip": "Laborator",
          "profesor": "Dr. Laura Petrescu",
          "sala": "GL1"
        }
      },
      "Miercuri": {
        "16:00–18:00": {
          "activitate": "Machine Learning (C)",
          "tip": "Curs",
          "profesor": "Dr. Laura Petrescu",
          "sala": "GC2"
        },
        "18:00–20:00": {
          "activitate": "Ml",
          "tip": "Seminar",
          "profesor": "Dr. Laura Petrescu",
          "sala": "GS2"
        }
      },
      "Joi": {
        "16:00–18:00": {
          "activitate": "Bd",
          "tip": "Laborator",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GL2"
        },
        "18:00–20:00": {
          "activitate": "Big Data (C)",
          "tip": "Curs",
          "profesor": "Lect. Gabriel Toma",
          "sala": "GC3"
        }
      },
      "Vineri": {
        "16:00–18:00": {
          "activitate": "Bd",
          "tip": "Proiect",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GP2"
        },
        "18:00–20:00": {
          "activitate": "Bd",
          "tip": "Seminar",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GS3"
        }
      }
    },
    "MI1b": {
      "Luni": {
        "16:00–18:00": {
          "activitate": "Cybersecurity (C)",
          "tip": "Curs",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GC1"
        },
        "18:00–20:00": {
          "activitate": "Cy",
          "tip": "Seminar",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GS1"
        }
      },
      "Marti": {
        "16:00–18:00": {
          "activitate": "Sw",
          "tip": "Proiect",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GP1"
        },
        "18:00–20:00": {
          "activitate": "Bd",
          "tip": "Laborator",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GL3"
        }
      },
      "Miercuri": {
        "16:00–18:00": {
          "activitate": "Machine Learning (C)",
          "tip": "Curs",
          "profesor": "Dr. Laura Petrescu",
          "sala": "GC2"
        },
        "18:00–20:00": {
          "activitate": "Ml",
          "tip": "Seminar",
          "profesor": "Dr. Laura Petrescu",
          "sala": "GS2"
        }
      },
      "Joi": {
        "16:00–18:00": {
          "activitate": "Ml",
          "tip": "Laborator",
          "profesor": "Dr. Laura Petrescu",
          "sala": "GL4"
        },
        "18:00–20:00": {
          "activitate": "Big Data (C)",
          "tip": "Curs",
          "profesor": "Lect. Gabriel Toma",
          "sala": "GC3"
        }
      },
      "Vineri": {
        "16:00–18:00": {
          "activitate": "Bd",
          "tip": "Proiect",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GP2"
        },
        "18:00–20:00": {
          "activitate": "Bd",
          "tip": "Seminar",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GS3"
        }
      }
    }
  }
}



{
  "Master": {
    "MII1a": {
      "Luni": {
        "16:00–18:00": {
          "activitate": "Bioinformatică (C)",
          "tip": "Curs",
          "profesor": "Lect. Silviu Coman",
          "sala": "GC4"
        },
        "18:00–20:00": {
          "activitate": "Bio",
          "tip": "Laborator",
          "profesor": "Lect. Silviu Coman",
          "sala": "GL5"
        }
      },
      "Marti": {
        "16:00–18:00": {
          "activitate": "IAE (C)",
          "tip": "Curs",
          "profesor": "Dr. Loredana Petrescu",
          "sala": "GC5"
        },
        "18:00–20:00": {
          "activitate": "IAE",
          "tip": "Seminar",
          "profesor": "Dr. Loredana Petrescu",
          "sala": "GS5"
        }
      },
      "Miercuri": {
        "16:00–18:00": {
          "activitate": "APS (C)",
          "tip": "Curs",
          "profesor": "Conf. Ovidiu Stan",
          "sala": "GC6"
        },
        "18:00–20:00": {
          "activitate": "APS",
          "tip": "Proiect",
          "profesor": "Conf. Ovidiu Stan",
          "sala": "GP3"
        }
      },
      "Joi": {
        "16:00–18:00": {
          "activitate": "IAE",
          "tip": "Proiect",
          "profesor": "Dr. Loredana Petrescu",
          "sala": "GP4"
        },
        "18:00–20:00": {
          "activitate": "APS",
          "tip": "Seminar",
          "profesor": "Conf. Ovidiu Stan",
          "sala": "GS6"
        }
      },
      "Vineri": {
        "16:00–18:00": {
          "activitate": "APS",
          "tip": "Laborator",
          "profesor": "Conf. Ovidiu Stan",
          "sala": "GL6"
        },
        "18:00–20:00": {
          "activitate": "IAE",
          "tip": "Laborator",
          "profesor": "Dr. Loredana Petrescu",
          "sala": "GL7"
        }
      }
    },
    "MII1b": {
      "Luni": {
        "16:00–18:00": {
        "activitate": "Bioinformatică (C)",
          "tip": "Curs",
          "profesor": "Lect. Silviu Coman",
          "sala": "GC4"
        },
        "18:00–20:00": {          
        "activitate": "IAE",
          "tip": "Laborator",
          "profesor": "Dr. Loredana Petrescu",
          "sala": "GL10"
        }
      },
      "Marti": {
        "16:00–18:00": {
          "activitate": "IAE (C)",
          "tip": "Curs",
          "profesor": "Dr. Loredana Petrescu",
          "sala": "GC5"
        },
        "18:00–20:00": {
          "activitate": "IAE",
          "tip": "Seminar",
          "profesor": "Dr. Loredana Petrescu",
          "sala": "GS5"
        }
      },
      "Miercuri": {
        "16:00–18:00": {
          "activitate": "APS (C)",
          "tip": "Curs",
          "profesor": "Conf. Ovidiu Stan",
          "sala": "GC6"
        },
        "18:00–20:00": {
          "activitate": "APS",
          "tip": "Proiect",
          "profesor": "Conf. Ovidiu Stan",
          "sala": "GP3"
        }
      },
      "Joi": {
        "16:00–18:00": {
          "activitate": "IAE",
          "tip": "Proiect",
          "profesor": "Dr. Loredana Petrescu",
          "sala": "GP4"
        },
        "18:00–20:00": {
          "activitate": "APS",
          "tip": "Seminar",
          "profesor": "Conf. Ovidiu Stan",
          "sala": "GS6"
        }
      },
      "Vineri": {
        "16:00–18:00": {
          "activitate": "Bio",
          "tip": "Laborator",
          "profesor": "Lect. Silviu Coman",
          "sala": "GL8"
        },
        "18:00–20:00": {
          "activitate": "APS",
          "tip": "Laborator",
          "profesor": "Conf. Ovidiu Stan",
          "sala": "GL9"
        }
      }
    }
  }
}


🚫 ESTE INTERZIS CA DOUĂ SUBGRUPE SĂ AIBĂ LABORATORUL ÎN ACELAȘI INTERVAL ORAR ȘI ACEEAȘI ZI!  Laboratoarele trebuie să fie programate în zile și intervale orare diferite pentru fiecare subgrupă.

📌 REGULĂ 1
- Nivelul este Licență sau Master, iar anul este I, II, III, IV, grupa este LI1, LI2, LII1 etc. pentru Licență și MI1, MI2, MII1 etc. pentru Master, subgrupa este LI1a, LI1b, LI2a, LI2b etc. pentru Licență și MI1a, MI1b, MII1a, MII1b etc. pentru Master.
- Seminarele, laboratoarele și proiectele se vor genera DOAR pentru disciplinele care au deja curs programat în orar.
- Dacă un curs nu este programat pentru acel an, nu vor exista seminare, laboratoare sau proiecte pentru disciplina respectivă.
- Astfel, toate seminarele, laboratoarele și proiectele sunt direct legate de cursurile prezente în orar.


📌 Structura generală:
- NU include chei globale precum "luni", "marti" etc.
- Toate activitățile trebuie plasate DOAR în interiorul grupelor/subgrupelor, sub cheile "Licenta" și "Master".
- Formatul JSON trebuie să respecte modelul de mai jos (NU folosi array-uri, fiecare interval este un obiect):
!!! Afișează toate intervalele ORARE pentru acest nivel și an, chiar dacă nu există activități.


{
  "Master": {
    "MI1a": {
      "Luni": {
        "16:00–18:00": {
          "activitate": "Cybersecurity (C)",
          "tip": "Curs",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GC1"
        },
        "18:00–20:00": {
          "activitate": "Cy",
          "tip": "Seminar",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GS1"
        }
      },
      "Marti": {
        "16:00–18:00": {
          "activitate": "Sw",
          "tip": "Proiect",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GP1"
        },
        "18:00–20:00": {
          "activitate": "Ml",
          "tip": "Laborator",
          "profesor": "Dr. Laura Petrescu",
          "sala": "GL1"
        }
      },
      "Miercuri": {
        "16:00–18:00": {
          "activitate": "Machine Learning (C)",
          "tip": "Curs",
          "profesor": "Dr. Laura Petrescu",
          "sala": "GC2"
        },
        "18:00–20:00": {
          "activitate": "Ml",
          "tip": "Seminar",
          "profesor": "Dr. Laura Petrescu",
          "sala": "GS2"
        }
      },
      "Joi": {
        "16:00–18:00": {
          "activitate": "Bd",
          "tip": "Laborator",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GL2"
        },
        "18:00–20:00": {
          "activitate": "Big Data (C)",
          "tip": "Curs",
          "profesor": "Lect. Gabriel Toma",
          "sala": "GC3"
        }
      },
      "Vineri": {
        "16:00–18:00": {
          "activitate": "Bd",
          "tip": "Proiect",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GP2"
        },
        "18:00–20:00": {
          "activitate": "Bd",
          "tip": "Seminar",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GS3"
        }
      }
    },
    "MI1b": {
      "Luni": {
        "16:00–18:00": {
          "activitate": "Cybersecurity (C)",
          "tip": "Curs",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GC1"
        },
        "18:00–20:00": {
          "activitate": "Cy",
          "tip": "Seminar",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GS1"
        }
      },
      "Marti": {
        "16:00–18:00": {
          "activitate": "Sw",
          "tip": "Proiect",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GP1"
        },
        "18:00–20:00": {
          "activitate": "Bd",
          "tip": "Laborator",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GL3"
        }
      },
      "Miercuri": {
        "16:00–18:00": {
          "activitate": "Machine Learning (C)",
          "tip": "Curs",
          "profesor": "Dr. Laura Petrescu",
          "sala": "GC2"
        },
        "18:00–20:00": {
          "activitate": "Ml",
          "tip": "Seminar",
          "profesor": "Dr. Laura Petrescu",
          "sala": "GS2"
        }
      },
      "Joi": {
        "16:00–18:00": {
          "activitate": "Ml",
          "tip": "Laborator",
          "profesor": "Dr. Laura Petrescu",
          "sala": "GL4"
        },
        "18:00–20:00": {
          "activitate": "Big Data (C)",
          "tip": "Curs",
          "profesor": "Lect. Gabriel Toma",
          "sala": "GC3"
        }
      },
      "Vineri": {
        "16:00–18:00": {
          "activitate": "Bd",
          "tip": "Proiect",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GP2"
        },
        "18:00–20:00": {
          "activitate": "Bd",
          "tip": "Seminar",
          "profesor": "Prof. Camelia Oprea",
          "sala": "GS3"
        }
      }
    }
  }
}

"Licenta": {
    "LIV1a": {
      "Luni": {
        "08:00–10:00": {
          "activitate": "Inteligență Artificială (C)",
          "tip": "Curs",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GC1"
        },
        "10:00–12:00": {
          "activitate": "IA",
          "tip": "Laborator",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GL1"
        },
        "12:00–14:00": {
          "activitate": "IA",
          "tip": "Proiect",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GP1"
        }
      },
      "Marti": {
        "08:00–10:00": {
          "activitate": "AC (C)",
          "tip": "Curs",
          "profesor": "Dr. Nicoleta Anton",
          "sala": "GC2"
        },
        "10:00–12:00": {
          "activitate": "AC",
          "tip": "Laborator",
          "profesor": "Dr. Nicoleta Anton",
          "sala": "GL2"
        },
        "12:00–14:00": {
          "activitate": "PPy (C)",
          "tip": "Curs",
          "profesor": "Dr. Cristian Barbu",
          "sala": "GC3"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "PPy",
          "tip": "Proiect",
          "profesor": "Dr. Cristian Barbu",
          "sala": "GP2"
        }
      },
      "Miercuri": {
        "08:00–10:00": {
          "activitate": "C/C++ (C)",
          "tip": "Curs",
          "profesor": "Lect. Radu Manole",
          "sala": "GC4"
        },
        "10:00–12:00": {
          "activitate": "C/C++",
          "tip": "Laborator",
          "profesor": "Lect. Radu Manole",
          "sala": "GL3"
        },
        "12:00–14:00": {
          "activitate": "C/C++",
          "tip": "Seminar",
          "profesor": "Lect. Radu Manole",
          "sala": "GS1"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "DA (C)",
          "tip": "Curs",
          "profesor": "Lect. Ioana Dobre",
          "sala": "GC5"
        }
      },
      "Joi": {
        "08:00–10:00": {
          "activitate": "DA",
          "tip": "Seminar",
          "profesor": "Lect. Ioana Dobre",
          "sala": "GS2"
        },
        "10:00–12:00": {
          "activitate": "SO (C)",
          "tip": "Curs",
          "profesor": "Neagu Gabriela",
          "sala": "GC6"
        },
        "12:00–14:00": {
          "activitate": "SO",
          "tip": "Seminar",
          "profesor": "Neagu Gabriela",
          "sala": "GS3"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "PJ (C)",
          "tip": "Curs",
          "profesor": "Iliescu Sorin",
          "sala": "GC7"
        }
      },
      "Vineri": {
        "08:00–10:00": {
          "activitate": "PJ",
          "tip": "Laborator",
          "profesor": "Iliescu Sorin",
          "sala": "GL4"
        },
        "10:00–12:00": {
          "activitate": "PPy",
          "tip": "Laborator",
          "profesor": "Dr. Cristian Barbu",
          "sala": "GL5"
        },
        "12:00–14:00": {
          "activitate": "DA",
          "tip": "Proiect",
          "profesor": "Lect. Ioana Dobre",
          "sala": "GP3"
        }
      }
    },
    "LIV1b": {
      "Luni": {
        "08:00–10:00": {
          "activitate": "Inteligență Artificială (C)",
          "tip": "Curs",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GC1"
        },
        "10:00–12:00": {
          "activitate": "AC",
          "tip": "Laborator",
          "profesor": "Dr. Nicoleta Anton",
          "sala": "GL7"
        },
        "12:00–14:00": {
          "activitate": "IA",
          "tip": "Proiect",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GP1"
        }
      },
      "Marti": {
        "08:00–10:00": {
          "activitate": "AC (C)",
          "tip": "Curs",
          "profesor": "Dr. Nicoleta Anton",
          "sala": "GC2"
        },
        "10:00–12:00": {
          "activitate": "IA",
          "tip": "Laborator",
          "profesor": "Conf. Adrian Ilie",
          "sala": "GL6"
        },
        "12:00–14:00": {
          "activitate": "PPy (C)",
          "tip": "Curs",
          "profesor": "Dr. Cristian Barbu",
          "sala": "GC3"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "PPy",
          "tip": "Proiect",
          "profesor": "Dr. Cristian Barbu",
          "sala": "GP2"
        }
      },
      "Miercuri": {
        "08:00–10:00": {
          "activitate": "C/C++ (C)",
          "tip": "Curs",
          "profesor": "Lect. Radu Manole",
          "sala": "GC4"
        },
        "10:00–12:00": {
          "activitate": "PPy",
          "tip": "Laborator",
          "profesor": "Dr. Cristian Barbu",
          "sala": "GL10"

        },
        "12:00–14:00": {
          "activitate": "C/C++",
          "tip": "Seminar",
          "profesor": "Lect. Radu Manole",
          "sala": "GS1"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "DA (C)",
          "tip": "Curs",
          "profesor": "Lect. Ioana Dobre",
          "sala": "GC5"
        }
      },
      "Joi": {
        "08:00–10:00": {
          "activitate": "DA",
          "tip": "Seminar",
          "profesor": "Lect. Ioana Dobre",
          "sala": "GS2"
        },
        "10:00–12:00": {
          "activitate": "SO (C)",
          "tip": "Curs",
          "profesor": "Neagu Gabriela",
          "sala": "GC6"
        },
        "12:00–14:00": {
          "activitate": "SO",
          "tip": "Seminar",
          "profesor": "Neagu Gabriela",
          "sala": "GS3"
        },
        "14:00–16:00": {},
        "16:00–18:00": {
          "activitate": "PJ (C)",
          "tip": "Curs",
          "profesor": "Iliescu Sorin",
          "sala": "GC7"
        }
      },
      "Vineri": {
        "08:00–10:00": {},
        "10:00–12:00": {
          "activitate": "C/C++",
          "tip": "Laborator",
          "profesor": "Lect. Radu Manole",
          "sala": "GL8"
        },
        "12:00–14:00": {
          "activitate": "DA",
          "tip": "Proiect",
          "profesor": "Lect. Ioana Dobre",
          "sala": "GP3"
        },
        "14:00–16:00": {
          "activitate": "PJ",
          "tip": "Laborator",
          "profesor": "Iliescu Sorin",
          "sala": "GL9"
        }
      }
    }
  }
}




✏️ FORMAT DENUMIRI ACTIVITĂȚI:
- La toate **cursurile (C)** se scrie denumirea completă a disciplinei + tipul (ex: "Programare Orientată pe Obiect (C)").
- La toate **seminarele, proiectele și laboratoarele** se scrie DOAR prescurtarea disciplinei + tipul (ex: "POO").
- NU scrie denumirea completă la activitățile practice.
- NU inversa aceste formate! Este obligatoriu.


📚 1. **CURSURI (pe AN)**
- Cursurile se organizează O SINGURĂ DATĂ pentru întregul AN (ex: LI2a, LI2b, LI2c).
- La Licență să am 7 cursuri aleatorii, iar la Master 3 cursuri aleatorii.
- Toate grupele din același an trebuie să aibă cursul în ACELAȘI MOMENT.
- Trebuie să apară:
  ✅ în ACEEAȘI ZI,  
  ✅ în ACELAȘI INTERVAL ORAR,  
  ✅ în ACEEAȘI SALĂ,  
  ✅ cu ACELAȘI PROFESOR  
  în toate grupele acelui an.
- NU genera cursuri individuale per grupă!
- Se folosesc exclusiv săli cu prefix **GC**.
- NU omite nicio grupă din an: toate trebuie să aibă TOATE cursurile comune.

🧩 2. **SEMINARE & PROIECTE (pe GRUPĂ)**
- Se organizează în aceeași zi, sală și interval orar pentru toate grupele din același an.
- Fiecare activitate are:
  ✅ o zi,  
  ✅ un interval orar,  
  ✅ o sală.
- Seminare → prefix **GS**
- Proiecte → prefix **GP**

🧪 3. **LABORATOARE **
- zi/sală/interval orar diferit pentru fiecare (MI1a diferit de MI1b, să NU AIBĂ aceeași zi).
- NU este permisă suprapunerea laboratoarelor între subgrupe.
- NU este permisă suprapunerea laboratoarelor între subgrupe în aceeași zi și interval orar.
- NU este permisă suprapunerea laboratoarelor între subgrupe în aceeași sală.
- NU este permis să fie două laboratoare în aceeași zi și nici în același interval orar pentru subgrupe diferite.
- Fiecare subgrupă are:
  ✅ o zi diferită,  
  ✅ un interval orar diferit,  
  ✅ o sală diferită.
- Prefix sală: **GL**
- NU este permisă suprapunerea dacă au același profesor sau aceeași sală.


🏛️ 4. **REGULI PENTRU SĂLI**
- O sală NU poate fi folosită simultan de mai multe activități (nici măcar la niveluri diferite).
- Sălile NU se împart între licență și master în același interval.
- Prefixe:
  - GC → Curs
  - GS → Seminar
  - GP → Proiect
  - GL → Laborator

⚠️ 5. **OBLIGAȚII FINALE**
- Fiecare grupă/subgrupă trebuie să aibă:
  ✅ Toate Cursurile cu anul  
  ✅ Toate Seminariile cu grupa  
  ✅ Toate Proiectele cu grupa 
  ✅ Laboratorele cu subgrupa
- Distribuie activitățile uniform pe parcursul săptămânii (Luni–Vineri).
- Respectă regula de minim 4– maxim 8 ore/zi pentru fiecare grupă de la Licență și la Master doar de la 16:00 la 20:00.
- Grupele pot avea un număr diferit de activități zilnice.
- NU lăsa zile fără activități pentru grupe/subgrupe.
`.trim();

const promptFinal = `


🔒 GENEREAZĂ DOAR PENTRU NIVELUL: **${nivelSelectat}**, anul: **${anSelectat}**.
‼️ NU include date din alt nivel. Dacă este Master, NU include Licență. 


✅ LISTA COMPLETĂ de profesori și discipline (nu inventa altele):
Se va genera orarul folosind doar profesori și disciplinele lor disponibile, se va respecta disponibilitatea lor și se va evita suprapunerea activităților.
- Nu genera de două ori exact același orar la o altă execuție.
- Scopul este ca fiecare generare să fie diferită, folosind combinații diferite de discipline și profesori disponibili.
${instructiuniProfesori}

🏫 Săli disponibile:
${instructiuniSali}
🚫 NU este permis să generezi săli fictive (ex: M101, A2, B5).
✅ Folosește DOAR codurile de săli din lista transmisă. Fără excepții.

👥 Grupe selectate (${nivelSelectat}, anul ${anSelectat}):
${instructiuniGrupe}

📌 REGULI STRICTE:
1. Cursurile sunt comune pentru tot anul (MI1a, MI1b), în aceeași zi, oră, sală, cu același profesor.
2. Seminarele & proiectele sunt pe grupă, în aceeași zi/oră/sală pt toate grupele.
3. Laboratoarele în zile/oră/sală diferite, fără suprapuneri.

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

    //setEsteOrarSalvat(false); // 👈 dezactivează indicatorul

    // Salvează automat în baza de date
try {
  await fetch("http://127.0.0.1:5000/salveaza_orar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nivel: nivelSelectat,
      an: anSelectat,
      orar: data,
      
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

    setLoadingGPT(false);
  };

const genereazaOrarClasic = async () => {
  setGeneratClasicUltimul(true);
  setLoadingClasic(true);
  try {
    const response = await fetch("http://127.0.0.1:5000/genereaza_algoritm_propriu", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nivel_selectat: nivelSelectat,
        an_selectat: anSelectat,
        grupe_selectate: grupe
          .filter((g) => g.nivel === nivelSelectat && String(g.an) === String(anSelectat))
          .map((g) => g.denumire)

      }),
    });

    const data = await response.json();

    if (data.orar) {
      setOrar(data.orar);
      valideazaOrarGenerat(data.orar);

      await fetch("http://127.0.0.1:5000/salveaza_orar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nivel: nivelSelectat,
          an: anSelectat,
          orar: data.orar,
        }),
      });
    } else {
      console.error("⚠️ Răspunsul nu conține câmpul 'orar'");
    }
  } catch (error) {
    console.error("Eroare la generare clasică:", error);
  }

  setLoadingClasic(false);
};




  return {
    profesori,
    sali,
    grupe,
    reguli,
    loadingGPT,
    loadingClasic,
    genereazaOrar,
    genereazaOrarClasic,
    generatClasicUltimul,
    setGeneratClasicUltimul
  };
};

export default useOrarGenerator;
