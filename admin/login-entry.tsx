import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminLogin from './login';
import '../src/index.css';

ReactDOM.createRoot(document.getElementById('admin-login')!).render(
  <React.StrictMode>
    <AdminLogin />
  </React.StrictMode>
);
