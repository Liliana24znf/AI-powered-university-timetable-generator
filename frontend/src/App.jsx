import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TimetableLayout from "./components/TimetableLayout";
import TimetableUniversityStep from "./pages/TimetableUniversityStep";
import TimetableGroupsStep from "./pages/TimetableGroupsStep";
import TimetableGroupingsStep from "./pages/TimetableGroupingsStep.jsx";
import TimetableActivitiesStep from "./pages/TimetableActivitiesStep";
import TimetableTeachersStep from "./pages/TimetableTeachersStep";
import TimetableCoursesStep from "./pages/TimetableCoursesStep";
import TimetableRulesStep from "./pages/TimetableRulesStep";
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
        <Route path="/timetable" element={<TimetableLayout />}>
          <Route path="universitate" element={<TimetableUniversityStep />} />
          <Route path="grupe" element={<TimetableGroupsStep />} />
          <Route path="grupari" element={<TimetableGroupingsStep />} />
          <Route path="activitati" element={<TimetableActivitiesStep />} />
          <Route path="profesori" element={<TimetableTeachersStep />} />
          <Route path="cursuri" element={<TimetableCoursesStep />} />
          <Route path="reguli" element={<TimetableRulesStep />} />
        </Route>
      </Routes>

    </Router>
  );
}

export default App;
