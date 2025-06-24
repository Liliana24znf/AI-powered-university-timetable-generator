import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GeneratedTimetable from "../pages/GeneratedTimetable";

jest.mock("../functiiLogice/orar/useOrarGenerator");
import useOrarGenerator from "../functiiLogice/orar/useOrarGenerator";

jest.mock("../functiiLogice/orar/useOrarSalvat", () => () => ({
  orareSalvate: [],
  esteOrarSalvat: false,
  incarcaOrarSalvat: jest.fn(),
  stergeOrar: jest.fn(),
  editeazaDenumire: jest.fn(),
  orareFiltrate: [
    {
      id: 1,
      nume: "Orar Test",
      nivel: "Licenta",
      an: "I",
      data_creare: new Date().toISOString(),
    },
  ],
}));

jest.mock("../functiiLogice/orar/useValidareOrar", () => () => ({
  valideazaOrarGenerat: jest.fn(() => ({
    procent: 100,
    mesaj: "Orar valid",
    erori: [],
  })),
}));

jest.mock("../functiiLogice/orar/useExportOrar", () => () => ({
  exportExcel: jest.fn(),
  exportPDF: jest.fn(),
}));

jest.mock("../functiiLogice/utils/usePreventBack", () => () => {});

describe("GeneratedTimetable", () => {
  beforeEach(() => {
    useOrarGenerator.mockReturnValue({
      genereazaOrar: jest.fn(),
      genereazaOrarClasic: jest.fn(),
      generatClasicUltimul: false,
      setGeneratClasicUltimul: jest.fn(),
      loadingGPT: false,
      loadingClasic: false,
    });
  });

  test("afișează titlul paginii și butoanele principale", () => {
    render(
      <MemoryRouter>
        <GeneratedTimetable />
      </MemoryRouter>
    );

    expect(screen.getByText(/📅 Orar Generat/i)).toBeInTheDocument();
    expect(screen.getByText(/Generează orar cu AI/i)).toBeInTheDocument();
    expect(screen.getByText(/Generează clasic/i)).toBeInTheDocument();
  });

  test("apelează genereazaOrar când se apasă butonul AI", () => {
    const mockGenereazaOrar = jest.fn();

    useOrarGenerator.mockReturnValueOnce({
      genereazaOrar: mockGenereazaOrar,
      genereazaOrarClasic: jest.fn(),
      generatClasicUltimul: false,
      setGeneratClasicUltimul: jest.fn(),
      loadingGPT: false,
      loadingClasic: false,
    });

    render(
      <MemoryRouter>
        <GeneratedTimetable />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Generează orar cu AI/i }));
    expect(mockGenereazaOrar).toHaveBeenCalled();
  });

  test("apelează genereazaOrarClasic când se apasă butonul pentru orar clasic", () => {
    const mockGenereazaOrarClasic = jest.fn();

    useOrarGenerator.mockReturnValueOnce({
      genereazaOrar: jest.fn(),
      genereazaOrarClasic: mockGenereazaOrarClasic,
      generatClasicUltimul: false,
      setGeneratClasicUltimul: jest.fn(),
      loadingGPT: false,
      loadingClasic: false,
    });

    render(
      <MemoryRouter>
        <GeneratedTimetable />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Generează clasic/i }));
    expect(mockGenereazaOrarClasic).toHaveBeenCalled();
  });

  test("afișează butonul de reîncărcare", () => {
    render(
      <MemoryRouter>
        <GeneratedTimetable />
      </MemoryRouter>
    );
    expect(screen.getByRole("button", { name: /🔄 Reîncarcă/i })).toBeInTheDocument();
  });

  test("afișează butonul de întoarcere", () => {
    render(
      <MemoryRouter>
        <GeneratedTimetable />
      </MemoryRouter>
    );
    expect(screen.getByRole("button", { name: /🔙 Înapoi/i })).toBeInTheDocument();
  });


  test("afișează orare salvate și butoane de acțiune", () => {
    render(
      <MemoryRouter>
        <GeneratedTimetable />
      </MemoryRouter>
    );
    expect(screen.getByText(/Orar Test/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Editează/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Șterge/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /🔄 Încarcă/i })).toBeInTheDocument();
    
  });

  test("afișează inputul de căutare pentru orare", () => {
    render(
      <MemoryRouter>
        <GeneratedTimetable />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/Caută orar după nume/i)).toBeInTheDocument();
  });


  

});
