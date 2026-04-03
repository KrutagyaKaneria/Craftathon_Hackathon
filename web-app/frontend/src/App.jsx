import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DriverSelection from './pages/DriverSelection.jsx';
import Verification from './pages/Verification.jsx';
import VehicleSelection from './pages/VehicleSelection.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AiServiceTest from './pages/AiServiceTest.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DriverSelection />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/vehicle-selection" element={<VehicleSelection />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ai-test" element={<AiServiceTest />} />
      </Routes>
    </Router>
  );
}

export default App;
