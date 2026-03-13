import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Home, History, Maximize, Activity } from 'lucide-react';

const API_BASE = "http://localhost:8000";

function App() {
  const [formData, setFormData] = useState({
    gr_liv_area: 1500,
    bedrooms: 3,
    overall_qual: 6
  });
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/predict`, formData);
      setPrediction(res.data.predicted_price);
      await fetchHistory(); 
    } catch (err) {
      console.error(err);
      alert("Error: Make sure your FastAPI server is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl text-white mb-4 shadow-lg">
          <Home size={32} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
          Ames Housing Predictor
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Machine Learning Valuation Dashboard</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Input Section */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit sticky top-8">
            <h2 className="text-lg font-bold mb-8 flex items-center gap-2 text-gray-800">
              <Activity size={20} className="text-blue-600" /> Property Details
            </h2>
            
            <form onSubmit={handlePredict} className="space-y-8">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Living Area (Sq Ft)</label>
                <input 
                  type="number" 
                  value={formData.gr_liv_area}
                  onChange={(e) => setFormData({...formData, gr_liv_area: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-lg font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Total Bedrooms</label>
                <input 
                  type="number" 
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-lg font-semibold"
                  required
                />
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-end mb-4">
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400">Construction Quality</label>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full text-white shadow-sm transition-colors ${
                    formData.overall_qual > 7 ? 'bg-green-500' : formData.overall_qual > 4 ? 'bg-blue-600' : 'bg-orange-500'
                  }`}>
                    Grade: {formData.overall_qual}/10
                  </span>
                </div>
                <input 
                  type="range" min="1" max="10" step="1"
                  value={formData.overall_qual}
                  onChange={(e) => setFormData({...formData, overall_qual: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transform transition active:scale-95 ${
                  loading ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {loading ? "PROCESSING..." : "GET VALUATION"}
              </button>
            </form>
          </div>
        </section>

        {/* RIGHT: Comparison Log & Detailed Results */}
        <section className="lg:col-span-8 space-y-8">
          
          {/* Main Price Card with Config Summary */}
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-left space-y-2">
                <h3 className="text-gray-400 uppercase tracking-widest text-[10px] font-black">Latest Configuration</h3>
                <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Area</p>
                    <p className="font-bold text-gray-700">{formData.gr_liv_area} ft²</p>
                  </div>
                  <div className="border-l border-gray-100 pl-4">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Beds</p>
                    <p className="font-bold text-gray-700">{formData.bedrooms}</p>
                  </div>
                  <div className="border-l border-gray-100 pl-4">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Quality</p>
                    <p className="font-bold text-gray-700">{formData.overall_qual}/10</p>
                  </div>
                </div>
              </div>

              <div className="text-center md:text-right">
                <h3 className="text-gray-400 uppercase tracking-widest text-[10px] font-black mb-1">Estimated Value</h3>
                <div className="text-6xl font-black text-gray-900 tracking-tight">
                  {prediction ? (
                    <span className="text-green-600">
                      ${Number(prediction).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  ) : (
                    <span className="text-gray-200">---</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Log Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-2">
              <History size={18} className="text-blue-600" /> 
              <span className="font-bold text-gray-800 uppercase tracking-wider text-sm">Prediction Log (Input vs Output)</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Input: Area</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Input: Beds</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Input: Qual</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-blue-600 tracking-widest text-right">Output: Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.length > 0 ? (
                    history.map((item, index) => (
                      <tr key={item.id} className={`${index === 0 ? 'bg-blue-50/40' : ''} hover:bg-gray-50 transition-colors`}>
                        <td className="px-6 py-4 text-sm font-bold text-gray-700">
                          {item.gr_liv_area.toLocaleString()} sqft
                          {index === 0 && <span className="ml-2 text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase">Current</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{item.bedrooms}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded text-[10px] font-black ${
                               item.overall_qual > 7 ? 'text-green-600' : item.overall_qual > 4 ? 'text-blue-600' : 'text-orange-600'
                           }`}>
                             {item.overall_qual}/10
                           </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-gray-900 text-right">
                          ${item.predicted_price.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium italic">No predictions yet. Adjust features and click 'Get Valuation'.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;