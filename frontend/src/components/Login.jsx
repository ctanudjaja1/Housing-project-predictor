import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, LogIn } from 'lucide-react';

const Login = ({ setToken, API_BASE }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 1. LOGIN LOGIC
  const handleLogin = async (e) => {
    e.preventDefault();
    const loginData = new FormData();
    loginData.append('username', username);
    loginData.append('password', password);

    try {
      const res = await axios.post(`${API_BASE}/token`, loginData);
      localStorage.setItem('token', res.data.access_token);
      setToken(res.data.access_token);
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      alert("Invalid login credentials!");
    }
  };

  // 2. REGISTER LOGIC
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/register`, {
        username: username,
        password: password
      });
      alert("Registration successful! Now please log in.");
      setIsRegistering(false); // Switch back to login mode
    } catch (err) {
      console.error("Registration Error:", err.response?.data || err.message);
      alert("Registration failed. Username might already be taken.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl text-white mb-4 shadow-blue-100 shadow-lg">
            {isRegistering ? <UserPlus size={24} /> : <LogIn size={24} />}
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            {isRegistering ? "Create Account" : "Secure AI Access"}
          </h2>
          <p className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-widest">
            {isRegistering ? "Join the Valuation Pipeline" : "Authorized Personnel Only"}
          </p>
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Username</label>
            <input 
              type="text" 
              required
              className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition shadow-lg shadow-blue-100 active:scale-[0.98]">
            {isRegistering ? "SIGN UP" : "SIGN IN"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[11px] font-black uppercase text-blue-600 hover:text-blue-800 transition tracking-wider"
          >
            {isRegistering ? "Already have an account? Log In" : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;