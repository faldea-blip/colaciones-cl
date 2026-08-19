// src/components/BottomNav.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, PlusCircle, Heart } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Compass size={22} className="nav-icon" />
        <span>Colaciones</span>
      </NavLink>

      <NavLink
        to="/publicar"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <PlusCircle size={22} className="nav-icon" />
        <span>Cocinar</span>
      </NavLink>

      <NavLink
        to="/aportar"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Heart size={22} className="nav-icon" />
        <span>Aportar</span>
      </NavLink>
    </nav>
  );
};
