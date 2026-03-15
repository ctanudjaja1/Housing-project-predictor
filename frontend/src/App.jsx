import React, { useState } from 'react';
import Login from './components/Login';
import Predictor from './components/Predictor';

const API_BASE = "http://localhost:8000";

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <>
      {!token ? (
        <Login setToken={setToken} API_BASE={API_BASE} />
      ) : (
        <Predictor token={token} API_BASE={API_BASE} onLogout={logout} />
      )}
    </>
  );
}

export default App;