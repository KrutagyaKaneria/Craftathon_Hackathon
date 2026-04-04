import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import DriverSelection from './pages/DriverSelection.jsx';
import Verification from './pages/Verification.jsx';
import VehicleSelection from './pages/VehicleSelection.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Sessions from './pages/Sessions.jsx';
import AiServiceTest from './pages/AiServiceTest.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<DriverSelection />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/vehicle-selection" element={<VehicleSelection />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/ai-test" element={<AiServiceTest />} />
      </Routes>
    </Router>
  );
}

export default App;
