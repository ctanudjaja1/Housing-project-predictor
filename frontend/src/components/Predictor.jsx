import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Home, History, Activity, Calendar, Warehouse, Car, LogOut, Trash2, RotateCcw, XCircle, ArchiveX } from 'lucide-react';

const Predictor = ({ token, API_BASE, onLogout }) => {
  const [formData, setFormData] = useState({
    gr_liv_area: 1500, bedrooms: 3, overall_qual: 6,
    year_built: 2000, total_bsmt_sf: 800, garage_cars: 2
  });
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/history?trash=${showTrash}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      console.error("History fetch failed:", err);
    }
  }, [token, API_BASE, showTrash]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // --- Soft delete (move to trash) ---
  const handleDeleteSingle = async (id) => {
    if (!window.confirm("Move this prediction to trash?")) return;
    try {
      await axios.delete(`${API_BASE}/predictions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHistory();
    } catch (err) {
      console.error("Delete failed:", err.response?.data?.detail || err.message);
    }
  };

  // --- Soft clear-all (move ALL active items to trash at once) ---
  const handleSoftClearAll = async () => {
    if (!window.confirm("Move ALL active predictions to trash?")) return;
    try {
      await axios.delete(`${API_BASE}/history/clear-soft`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHistory();
    } catch (err) {
      console.error("Soft clear-all failed:", err.response?.data?.detail || err.message);
    }
  };

  // --- Restore a single item from trash ---
  const handleRestore = async (id) => {
    try {
      await axios.post(`${API_BASE}/predictions/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHistory();
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };

  // --- Permanent delete a single item from trash ---
  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Permanently delete this prediction? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE}/predictions/${id}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHistory();
    } catch (err) {
      console.error("Permanent delete failed:", err.response?.data?.detail || err.message);
    }
  };

  // --- Purge: permanently delete everything in trash ---
  const handlePurgeTrash = async () => {
    if (!window.confirm("Permanently delete ALL items in trash? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE}/history/purge`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHistory();
    } catch (err) {
      console.error("Purge failed:", err.response?.data?.detail || err.message);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        gr_liv_area: Number(formData.gr_liv_area),
        bedrooms: parseInt(formData.bedrooms),
        overall_qual: parseInt(formData.overall_qual),
        year_built: parseInt(formData.year_built),
        total_bsmt_sf: Number(formData.total_bsmt_sf),
        garage_cars: parseInt(formData.garage_cars)
      };
      const res = await axios.post(`${API_BASE}/predict`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrediction(res.data.predicted_price);
      setShowTrash(false);
      fetchHistory();
    } catch (err) {
      console.error(err);
      onLogout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <header className="max-w-6xl mx-auto mb-10 text-center relative">
        <button
          onClick={onLogout}
          className="absolute right-0 top-0 flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition"
        >
          <LogOut size={14} /> Logout
        </button>

        <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl text-white mb-4 shadow-lg">
          <Home size={32} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">House Valuation AI</h1>
        <p className="text-gray-500 mt-2 font-medium">Real-Time ETL & Prediction Pipeline</p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
              <Activity size={20} className="text-blue-600" /> Property Specs
            </h2>

            <form onSubmit={handlePredict} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Living Area</label>
                  <input type="number" value={formData.gr_liv_area} onChange={(e) => setFormData({...formData, gr_liv_area: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Bedrooms</label>
                  <input type="number" value={formData.bedrooms} onChange={(e) => setFormData({...formData, bedrooms: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Year Built</label>
                  <input type="number" value={formData.year_built} onChange={(e) => setFormData({...formData, year_built: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Basement SF</label>
                  <input type="number" value={formData.total_bsmt_sf} onChange={(e) => setFormData({...formData, total_bsmt_sf: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Garage Capacity</label>
                <select value={formData.garage_cars} onChange={(e) => setFormData({...formData, garage_cars: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-blue-500 appearance-none">
                  {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Car{n !== 1 ? 's' : ''}</option>)}
                </select>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-end mb-3">
                  <label className="text-[10px] font-black uppercase text-gray-400">Overall Quality</label>
                  <span className="text-[10px] font-black px-2 py-1 bg-blue-600 rounded text-white">{formData.overall_qual}/10</span>
                </div>
                <input type="range" min="1" max="10" value={formData.overall_qual} onChange={(e) => setFormData({...formData, overall_qual: parseInt(e.target.value)})} className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>

              <button type="submit" disabled={loading} className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition active:scale-95 ${loading ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}>
                {loading ? "PROCESSING..." : "GET VALUATION"}
              </button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
              <div>
                <h3 className="text-gray-400 uppercase tracking-widest text-[10px] font-black mb-4 italic">Current Run Analysis</h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-600">{formData.year_built}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    <Warehouse size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-600">{formData.total_bsmt_sf} Bsmt</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    <Car size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-600">{formData.garage_cars} Garage</span>
                  </div>
                </div>
              </div>

              <div className="md:text-right">
                <h3 className="text-gray-400 uppercase tracking-widest text-[10px] font-black mb-1">Estimated Valuation</h3>
                <div className="text-5xl font-black text-gray-900">
                  {prediction ? <span className="text-green-600">${Number(prediction).toLocaleString()}</span> : <span className="text-gray-200">---</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History size={18} className="text-blue-600" />
                <span className="font-bold text-gray-800 uppercase tracking-wider text-xs">
                  {showTrash ? "Recycle Bin" : "Prediction Log"}
                </span>

                {/* Toggle between active / trash views */}
                <button
                  onClick={() => setShowTrash(!showTrash)}
                  className={`text-[9px] font-black uppercase px-2 py-1 rounded transition border ${
                    showTrash
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : 'bg-gray-50 text-gray-400 border-gray-100 hover:text-gray-600'
                  }`}
                >
                  {showTrash ? "View Active" : "View Trash"}
                </button>
              </div>

              {/* Bulk action — changes based on which view is active */}
              {history.length > 0 && (
                showTrash ? (
                  /* Empty Trash: permanently deletes everything in trash */
                  <button
                    onClick={handlePurgeTrash}
                    className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded border bg-red-50 text-red-500 border-red-100 hover:bg-red-100 transition"
                    title="Permanently delete all trashed items"
                  >
                    <ArchiveX size={11} /> Empty Trash
                  </button>
                ) : (
                  /* Clear All: soft-deletes all active records at once */
                  <button
                    onClick={handleSoftClearAll}
                    className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded border bg-gray-50 text-gray-400 border-gray-100 hover:text-red-500 hover:border-red-100 transition"
                    title="Move all active predictions to trash"
                  >
                    <Trash2 size={11} /> Clear All
                  </button>
                )
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400">SqFt</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400">Built</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400">Basement</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400">Garage</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-blue-600 text-right">Valuation</th>
                    {/* Two action columns when in trash view, one when in active view */}
                    <th className="px-4 py-4" colSpan={showTrash ? 2 : 1}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.length > 0 ? (
                    history.map((item, index) => (
                      <tr key={item.id} className={`${index === 0 && !showTrash ? 'bg-blue-50/30' : ''} hover:bg-gray-50 transition-colors`}>
                        <td className="px-6 py-4 text-xs font-bold text-gray-700">{item.gr_liv_area}</td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">{item.year_built}</td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">{item.total_bsmt_sf}</td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">{item.garage_cars} Car</td>
                        <td className="px-6 py-4 text-xs font-black text-gray-900 text-right">
                          ${item.predicted_price.toLocaleString()}
                        </td>

                        {showTrash ? (
                          <>
                            {/* Restore */}
                            <td className="px-2 py-4 text-right">
                              <button
                                onClick={() => handleRestore(item.id)}
                                className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                                title="Restore"
                              >
                                <RotateCcw size={14} />
                              </button>
                            </td>
                            {/* Permanent delete */}
                            <td className="px-2 py-4 text-right">
                              <button
                                onClick={() => handlePermanentDelete(item.id)}
                                className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                                title="Delete permanently"
                              >
                                <XCircle size={14} />
                              </button>
                            </td>
                          </>
                        ) : (
                          /* Soft delete */
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => handleDeleteSingle(item.id)}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                              title="Move to trash"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={showTrash ? 7 : 6} className="px-6 py-10 text-center text-gray-400 italic">
                        {showTrash ? "Trash is empty." : "No historical data found."}
                      </td>
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
};

export default Predictor;