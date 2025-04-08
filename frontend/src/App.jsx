import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import GeneratedTimetable from "./pages/GeneratedTimetable";
import Profesori from "./pages/Profesori.jsx";
import Sali from "./pages/Sali.jsx";



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
       
      </Routes>

    </Router>
  );
}

export default App;
