import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import React from "react";

test("afișează titlul și butonul de autentificare", () => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );

  // Test pentru titlul (h3)
  expect(screen.getByRole("heading", { name: "Autentificare" })).toBeInTheDocument();

  // Test pentru butonul de autentificare
  expect(screen.getByRole("button", { name: "Autentificare" })).toBeInTheDocument();

  // Teste suplimentare pentru inputuri
  expect(screen.getByPlaceholderText(/Introduceți email/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Introduceți parola/i)).toBeInTheDocument();
});
