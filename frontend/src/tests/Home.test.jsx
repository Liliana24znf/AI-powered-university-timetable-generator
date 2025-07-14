import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import Home from "../pages/Home";
import useHomeLogic from "../functiiLogice/dashboard/useHomeLogic";

// ✅ Mock hooks
jest.mock("../functiiLogice/dashboard/useHomeLogic");
jest.mock("../functiiLogice/utils/usePreventBack", () => () => {});
jest.mock("../functiiLogice/utils/useScrollToTop", () => () => {});

describe("Pagina Home - NEautentificat", () => {
  beforeEach(() => {
    useHomeLogic.mockReturnValue({ user: null, handleLogout: jest.fn() });
  });

  test("afișează titlul aplicației și butonul de autentificare în navbar", () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(
      screen.getByText("Aplicație pentru planificare inteligentă utilizând tehnici de A.I.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Autentificare/i })).toBeInTheDocument();
  });

  test("afișează mesajul principal și butonul 'Autentifică-te'", () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/Planificare inteligentă a orarului/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Autentifică-te/i })).toBeInTheDocument();
  });

  test("afișează butonul 'Începe generarea orarului' dezactivat", () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const button = screen.getByRole("button", { name: /Începe generarea orarului/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/Autentifică-te pentru a accesa/i)).toBeInTheDocument();
  });
});

describe("Pagina Home - AUTENTIFICAT", () => {
  beforeEach(() => {
    useHomeLogic.mockReturnValue({
      user: { nume: "Liliana" },
      handleLogout: jest.fn(),
    });
  });

  test("afișează mesaj de bun venit și butoanele 'Orarul meu' și 'Logout'", () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/Bine ai revenit, Liliana/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Orarul meu/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Logout/i })).toBeInTheDocument();
  });

  test("afișează butonul 'Începe generarea orarului' activ și mesajul de redirecționare", () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const button = screen.getByRole("link", { name: /Începe generarea orarului/i });
    expect(button).toBeEnabled();
    expect(screen.getByText(/vei fi redirecționat către platforma/i)).toBeInTheDocument();
  });
});