import React from "react";
import PropTypes from "prop-types";

const zileOrdine = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];

const getBadgeClass = (tipActivitate) => {
  if (!tipActivitate) return "bg-secondary";
  const tip = tipActivitate.toLowerCase();
  if (tip.includes("curs")) return "bg-info";
  if (tip.includes("laborator")) return "bg-success";
  if (tip.includes("seminar")) return "bg-warning";
  return "bg-secondary";
};

const renderActivitate = (activitate) => {
  if (!activitate) return "-";
  if (typeof activitate === "object") {
    return (
      <>
        <span className={`badge ${getBadgeClass(activitate.tip)} mb-1`}>
          {activitate.activitate}
        </span>
        <div>{activitate.profesor}</div>
        <div className="text-muted">{activitate.sala}</div>
      </>
    );
  }
  return <span className="badge bg-secondary">{activitate}</span>;
};

const TabelGrupa = ({ nivel, denumireGrupa, zile }) => {
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
              {zileOrdine.map((zi) => (
                <td key={`${zi}-${interval}`}>
                  {renderActivitate(zile[zi]?.[interval])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const OrarTabel = ({ orar, nivelSelectat }) => {
  return (
    <div className="table-responsive" id="orar-afisat">
      {Object.entries(orar)
        .filter(([nivel]) => nivel === nivelSelectat)
        .map(([nivel, grupeOrar]) => (
          <div key={nivel}>
            <h2 className="text-primary fw-bold">{nivel}</h2>
            {Object.entries(grupeOrar).map(([denumireGrupa, zile]) => (
              <TabelGrupa
                key={`${nivel}-${denumireGrupa}`}
                nivel={nivel}
                denumireGrupa={denumireGrupa}
                zile={zile}
              />
            ))}
          </div>
        ))}
    </div>
  );
};

OrarTabel.propTypes = {
  orar: PropTypes.object.isRequired,
  nivelSelectat: PropTypes.string.isRequired,
};
TabelGrupa.propTypes = {
  nivel: PropTypes.string.isRequired,
  denumireGrupa: PropTypes.string.isRequired,
  zile: PropTypes.object.isRequired,
};

export default OrarTabel;
