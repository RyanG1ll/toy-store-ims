import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-brand">
        <h1>Toy Store IMS</h1>
      </div>
      <ul className="navbar-links">
        <li>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
            Products
          </NavLink>
        </li>
        <li>
          <NavLink to="/suppliers" className={({ isActive }) => isActive ? 'active' : ''}>
            Suppliers
          </NavLink>
        </li>
        <li>
          <NavLink to="/orders" className={({ isActive }) => isActive ? 'active' : ''}>
            Orders
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;