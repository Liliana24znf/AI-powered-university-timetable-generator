import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";

const useExportOrar = (orar) => {
  const zileOrdine = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];

  const exportExcel = () => {
    if (!orar) return;

    const wb = XLSX.utils.book_new();

    Object.entries(orar).forEach(([nivel, grupe]) => {
      Object.entries(grupe).forEach(([grupa, orarGrupa]) => {
        const data = [];

        zileOrdine.forEach((zi) => {
          const activitati = orarGrupa[zi];
          if (!activitati) return;

          const intervaleSortate = Object.keys(activitati).sort((a, b) => a.localeCompare(b));

          intervaleSortate.forEach((interval) => {
            const item = activitati[interval];
            data.push({
              Nivel: nivel,
              Grupa: grupa,
              Zi: zi,
              Interval: interval,
              Disciplina: item?.activitate || "",
              Tip: item?.tip || "",
              Profesor: item?.profesor || "",
              Sala: item?.sala || ""
            });
          });
        });

        const ws = XLSX.utils.json_to_sheet(data);

        ws["!cols"] = [
          { wch: 10 }, // Nivel
          { wch: 12 }, // Grupa
          { wch: 10 }, // Zi
          { wch: 15 }, // Interval
          { wch: 30 }, // Disciplina
          { wch: 15 }, // Tip
          { wch: 25 }, // Profesor
          { wch: 10 }  // Sala
        ];

        XLSX.utils.book_append_sheet(wb, ws, `${nivel}-${grupa}`);
      });
    });

    XLSX.writeFile(wb, "orar.xlsx");
  };

const exportPDF = () => {
  if (!orar) return;
  const element = document.getElementById("orar-afisat");

  const optiuni = {
    margin: [8.5, 8.5, 8.5, 8.5],
    filename: "orar.pdf",
    image: { type: "jpeg", quality: 1 },
    html2canvas: {
      scale: 8.5,
      useCORS: true,
      scrollY: 0
    },
    jsPDF: {
      unit: "mm",
      format: "a4", // A3 pentru lățime mai mare
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

  return { exportExcel, exportPDF };
};

export default useExportOrar;
