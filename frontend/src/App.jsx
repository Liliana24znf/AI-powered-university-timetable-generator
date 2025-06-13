import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import GeneratedTimetable from "./pages/GeneratedTimetable";
import Profesori from "./pages/Profesori.jsx";
import Sali from "./pages/Sali.jsx";
import Grupe from "./pages/Grupe.jsx";
import SetareReguli from "./pages/SetareReguli.jsx";




function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />  {/* Home este pagina principală */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />}/>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profesori" element={<Profesori />} />
        <Route path="/orar-generat" element={<GeneratedTimetable />} />
        <Route path="/sali" element={<Sali />} />
        <Route path="/grupe" element={<Grupe />} />
        <Route path="/setare-reguli" element={<SetareReguli />} />
       
      </Routes>

    </Router>
  );
}

export default App;
