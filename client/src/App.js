import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/theme.css';

// Importing page components (uncomment when ready)
// import Dashboard from './pages/Dashboard';
// import Products from './pages/Products';
// import Suppliers from './pages/Suppliers';
// import Orders from './pages/Orders';
// import Login from './pages/Auth/Login';

function App() {
  return (
    <Router>
      {/* Skip navigation link - essential for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <nav role="navigation" aria-label="Main navigation">
        {/* Navbar component goes here */}
      </nav>

      <main id="main-content" role="main">
        <h1>Toy Store IMS</h1>
        <Routes>
          {/* <Route path="/" element={<Dashboard />} /> */}
          {/* <Route path="/products" element={<Products />} /> */}
          {/* <Route path="/suppliers" element={<Suppliers />} /> */}
          {/* <Route path="/orders" element={<Orders />} /> */}
          {/* <Route path="/login" element={<Login />} /> */}
        </Routes>
      </main>

      <footer role="contentinfo">
        {/* Footer component */}
      </footer>
    </Router>
  );
}

export default App;