import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { initializeSystemData } from './utils/initializeData';
import DataDebugger from './components/debug/DataDebugger';
import './App.css';

function App() {
  const [showDebug, setShowDebug] = useState(false);
  
  useEffect(() => {
    // Initialize system data on app load
    initializeSystemData();
    
    // Enable debug mode with Ctrl+D
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setShowDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/teacher" element={<Dashboard />} />
          <Route path="/student" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        {showDebug && <DataDebugger />}
      </div>
    </Router>
  );
}

export default App;