import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import ProductModal from './pages/Products/ProductModal';
import Suppliers from './pages/Suppliers/Suppliers';
import Orders from './pages/Orders/Orders';
import OrderModal from './pages/Orders/OrderModal';
import './styles/theme.css';

function App() {
  return (
    <Router>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" role="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/orders" element={<Orders />} /> 
          <Route path="/products/new" element={<ProductModal />} />
          <Route path="/products/:id/edit" element={<ProductModal />} />
          <Route path="/orders/new" element={<OrderModal />} />
          <Route path="/orders/:id/edit" element={<OrderModal />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;