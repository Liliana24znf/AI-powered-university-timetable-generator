import { useState, useEffect } from "react";
import useOrarGenerator from "./useOrarGenerator";
import useExportOrar from "./useExportOrar";
import useOrarSalvat from "../functiiLogice/orar/useOrarSalvat.js";


const useGeneratedTimetable = (location) => {
  const {
    regula_id,
    denumire: denumireRegulaSelectata,
    continut: continutRegula,
    orar_id_selectat
  } = location.state || {};

  const [orar, setOrar] = useState(null);
  const [nivelSelectat, setNivelSelectat] = useState("Licenta");
  const [anSelectat, setAnSelectat] = useState("I");
  const [cautareOrar, setCautareOrar] = useState("");
  const [raportValidare, setRaportValidare] = useState("");

  const {
    profesori,
    sali,
    grupe,
    reguli,
    loadingGPT,
    loadingClasic,
    genereazaOrar,
    genereazaOrarClasic
  } = useOrarGenerator(
    nivelSelectat,
    anSelectat,
    setOrar,
    setRaportValidare,
    regula_id,
    continutRegula,
    () => setEsteOrarSalvat(false)
  );

  const {
    exportExcel,
    exportPDF
  } = useExportOrar(orar);

  const {
    orareSalvate,
    incarcaOrarSalvat,
    stergeOrar,
    editeazaDenumire,
    orareFiltrate
  } = useOrarSalvat(
    orar,
    setOrar,
    grupe,
    setNivelSelectat,
    setAnSelectat,
    orar_id_selectat,
    cautareOrar,
    setRaportValidare,
  valideazaOrarGenerat 
  );

  const [ setEsteOrarSalvat] = useState(false);

  useEffect(() => {
    if (orar_id_selectat && !orar) {
      incarcaOrarSalvat(orar_id_selectat);
    }
  }, [orar_id_selectat, orar]);

  return {
    orar,
    setOrar,
    nivelSelectat,
    setNivelSelectat,
    anSelectat,
    setAnSelectat,
    cautareOrar,
    setCautareOrar,
    raportValidare,
    setRaportValidare,
    profesori,
    sali,
    grupe,
    reguli,
    loadingGPT,
    loadingClasic,
    genereazaOrar,
    genereazaOrarClasic,
    exportExcel,
    exportPDF,
    orareSalvate,
    incarcaOrarSalvat,
    stergeOrar,
    editeazaDenumire,
    orareFiltrate,
    denumireRegulaSelectata,
    continutRegula
  };
};

export default useGeneratedTimetable;
