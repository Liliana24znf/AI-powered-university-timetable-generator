import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SetareReguli from "../pages/SetareReguli";
import useSetariReguli from "../functiiLogice/dashboard/useSetariReguli";

jest.mock("../functiiLogice/dashboard/useSetariReguli");
jest.mock("../functiiLogice/utils/usePreventBack", () => () => {});
jest.mock("../functiiLogice/utils/useScrollToTop", () => () => {});
describe("Pagina SetareReguli", () => {
  const mockSalveazaReguli = jest.fn();

  beforeEach(() => {
    useSetariReguli.mockReturnValue({
      navigate: jest.fn(),
      reguli: "Reguli test",
      setReguli: jest.fn(),
      idRegulaEditata: null,
      setIdRegulaEditata: jest.fn(),
      reguliFiltrate: [],
      setReguliFiltrate: jest.fn(),
      ultimeleReguli: [],
      setUltimeleReguli: jest.fn(),
      numeRegula: "",
      setNumeRegula: jest.fn(),
      loading: false,
      salveazaReguli: mockSalveazaReguli,
      regulaVizibila: "",
      setLoading: jest.fn(),
      reincarcaUltimeleReguli: jest.fn()
    });
  });

  test("afișează titlul principal și descrierea", () => {
    render(
      <BrowserRouter>
        <SetareReguli />
      </BrowserRouter>
    );
    expect(screen.getByText(/🧠 Setare Reguli/i)).toBeInTheDocument();
    expect(screen.getByText(/regulile care guvernează generarea orarului/i)).toBeInTheDocument();
  });


  test("apasă butonul de salvare reguli", () => {
    render(
      <BrowserRouter>
        <SetareReguli />
      </BrowserRouter>
    );
    const btn = screen.getByRole("button", { name: /Salvează/i });
    fireEvent.click(btn);
    expect(mockSalveazaReguli).toHaveBeenCalled();
  });

  test("afișează input pentru denumirea regulii", () => {
    render(
      <BrowserRouter>
        <SetareReguli />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText(/Ex: Reguli orare Licență și Master/i)).toBeInTheDocument();
  });

  test("afișează mesaj pentru lipsă reguli salvate", () => {
    render(
      <BrowserRouter>
        <SetareReguli />
      </BrowserRouter>
    );
    expect(screen.getByText(/Nu există reguli salvate/i)).toBeInTheDocument();
  });
});
