import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminDashboard from './dashboard';
import '../src/index.css';

ReactDOM.createRoot(document.getElementById('admin-dashboard')!).render(
  <React.StrictMode>
    <AdminDashboard />
  </React.StrictMode>
);
