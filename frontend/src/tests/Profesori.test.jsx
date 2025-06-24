import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import Profesori from "../pages/Profesori";
import useProfesoriLogic from "../functiiLogice/dashboard/useProfesoriLogic";

// Mock hooks
jest.mock("../functiiLogice/dashboard/useProfesoriLogic");
jest.mock("../functiiLogice/utils/usePreventBack", () => () => {});
jest.mock("../functiiLogice/utils/useScrollToTop", () => () => {});

describe("Pagina Profesori.jsx", () => {
  const mockAdaugaProfesor = jest.fn();

  beforeEach(() => {
    useProfesoriLogic.mockReturnValue({
      navigate: jest.fn(),
      lista: [],
      formular: {
        nume: "",
        discipline: [{ denumire: "", nivel: "", tipuri: [] }],
        disponibilitate: {}
      },
      setFormular: jest.fn(),
      touchedFields: { nume: false, discipline: [false] },
      setTouchedFields: jest.fn(),
      profesorEditat: null,
      setProfesorEditat: jest.fn(),
      loading: false,
      searchTerm: "",
      setSearchTerm: jest.fn(),
      handleFormChange: jest.fn(),
      handleDisciplinaChange: jest.fn(),
      adaugaDisciplina: jest.fn(),
      stergeDisciplina: jest.fn(),
      toggleTipActivitate: jest.fn(),
      toggleIntervalDisponibil: jest.fn(),
      handleBlur: jest.fn(),
      handleBlurDisciplina: jest.fn(),
      adaugaProfesor: mockAdaugaProfesor,
      actualizeazaProfesor: jest.fn(),
      stergeProfesor: jest.fn(),
      resetFormular: jest.fn(),
      fetchProfesori: jest.fn()
    });
  });

  test("afișează titlul și formularul de adăugare", () => {
    render(
      <BrowserRouter>
        <Profesori />
      </BrowserRouter>
    );

    expect(screen.getByText(/Gestionare Profesori/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nume complet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /salvează profesor/i })).toBeInTheDocument();
  });

  test("afișează mesajul 'Niciun profesor găsit' dacă lista este goală", () => {
    render(
      <BrowserRouter>
        <Profesori />
      </BrowserRouter>
    );

    expect(screen.getByText(/niciun profesor găsit/i)).toBeInTheDocument();
  });

  test("apasă butonul de salvare profesor", () => {
    render(
      <BrowserRouter>
        <Profesori />
      </BrowserRouter>
    );

    const btn = screen.getByRole("button", { name: /salvează profesor/i });
    fireEvent.click(btn);

    expect(mockAdaugaProfesor).toHaveBeenCalled();
  });

  test("afișează butonul 'Adaugă altă disciplină'", () => {
    render(
      <BrowserRouter>
        <Profesori />
      </BrowserRouter>
    );

    expect(screen.getByText(/adaugă altă disciplină/i)).toBeInTheDocument();
  });

  test("afișează tabelul cu zile și intervale orare", () => {
    render(
      <BrowserRouter>
        <Profesori />
      </BrowserRouter>
    );

    expect(screen.getByText(/Disponibilitate săptămânală/i)).toBeInTheDocument();
    expect(screen.getByText(/Luni/i)).toBeInTheDocument();
    expect(screen.getByText(/08:00-10:00/i)).toBeInTheDocument();
  });
});
