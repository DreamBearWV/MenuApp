import React, { useState, useEffect } from 'react';
import { ChefHat, Utensils, Plus, Trash2, Edit3, ExternalLink, RefreshCw, CheckCircle2, Circle, Upload } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// 輔助函式：確保圖片網址是完整的 (處理上傳的相對路徑)
const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({ name: '', imageUrl: '', sourceUrl: '' });

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/recipes`);
      const data = await res.json();
      setRecipes(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const openModal = (recipe = null) => {
    if (recipe) {
      setActiveModal(recipe);
      setFormData({ name: recipe.name, imageUrl: recipe.imageUrl || '', sourceUrl: recipe.sourceUrl || '' });
    } else {
      setActiveModal('add');
      setFormData({ name: '', imageUrl: '', sourceUrl: '' });
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setFormData({ name: '', imageUrl: '', sourceUrl: '' });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);

    try {
      setUploading(true);
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (res.ok && result.imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl: result.imageUrl }));
      } else {
        alert('照片上傳失敗');
      }
    } catch (err) {
      alert('圖片上傳發生錯誤！');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (activeModal === 'add') {
        const res = await fetch(`${API_BASE}/api/recipes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) fetchRecipes();
      } else {
        const res = await fetch(`${API_BASE}/api/recipes/${activeModal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) fetchRecipes();
      }
      closeModal();
    } catch (err) {
      alert('儲存失敗！');
    }
  };

  const toggleOrder = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/recipes/${id}/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOrdered: !currentStatus })
      });
      if (res.ok) {
        setRecipes(recipes.map(r => r.id === id ? { ...r, isOrdered: !currentStatus } : r));
      }
    } catch (err) {
      alert('更新失敗！');
    }
  };

  const resetOrders = async () => {
    if (!confirm('確定要清空今日所有點餐嗎？')) return;
    try {
      await fetch(`${API_BASE}/api/recipes/reset-orders`, { method: 'POST' });
      fetchRecipes();
    } catch (err) {
      alert('重置失敗！');
    }
  };

  const deleteRecipe = async (id) => {
    if (!confirm('確定要刪除這道菜嗎？')) return;
    try {
      await fetch(`${API_BASE}/api/recipes/${id}`, { method: 'DELETE' });
      setRecipes(recipes.filter(r => r.id !== id));
    } catch (err) {
      alert('刪除失敗！');
    }
  };

  const orderedRecipes = recipes.filter(r => r.isOrdered);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isCookingMode ? <ChefHat color="#e65100" /> : <Utensils color="#2e7d32" />}
          {isCookingMode ? '今日烹飪菜單 (Kitchen)' : '家庭點餐菜單'}
        </h1>
        <button
          onClick={() => setIsCookingMode(!isCookingMode)}
          style={{
            padding: '8px 12px',
            borderRadius: '20px',
            border: 'none',
            background: isCookingMode ? '#ffe0b2' : '#e8f5e9',
            color: isCookingMode ? '#e65100' : '#2e7d32',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          切換至 {isCookingMode ? '點餐模式' : '工人烹飪模式'}
        </button>
      </header>

      {isCookingMode ? (
        <div>
          <div style={{ background: '#fff3e0', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', color: '#e65100' }}>
            👨‍🍳 提示：以下為今日已點菜色，點擊連結可查看食譜教學。
          </div>
          {orderedRecipes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>今日尚未點菜 (No dishes ordered today)</p>
          ) : (
            orderedRecipes.map(item => (
              <div key={item.id} style={{ border: '2px solid #ffe0b2', borderRadius: '12px', padding: '16px', marginBottom: '16px', background: '#fff' }}>
                {item.imageUrl && (
                  <img src={getFullImageUrl(item.imageUrl)} alt={item.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} />
                )}
                <h2 style={{ margin: '0 0 12px 0', fontSize: '22px', color: '#333' }}>{item.name}</h2>
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      background: '#ff9800',
                      color: '#fff',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    <ExternalLink size={18} /> 查看食譜教學 (Recipe)
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => openModal()}
              style={{ flex: 1, padding: '10px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={18} /> 新增菜色
            </button>
            <button
              onClick={resetOrders}
              style={{ padding: '10px', background: '#f5f5f5', color: '#666', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={16} /> 清空今日點餐
            </button>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center' }}>載入中...</p>
          ) : recipes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888' }}>目前還沒有菜色，快點擊「新增菜色」吧！</p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {recipes.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    background: item.isOrdered ? '#e8f5e9' : '#fff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }} onClick={() => toggleOrder(item.id, item.isOrdered)}>
                    {item.isOrdered ? <CheckCircle2 color="#2e7d32" /> : <Circle color="#ccc" />}
                    {item.imageUrl && (
                      <img src={getFullImageUrl(item.imageUrl)} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 'bold', color: item.isOrdered ? '#2e7d32' : '#333' }}>{item.name}</div>
                      {item.sourceUrl && (
                        <a href={item.sourceUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '12px', color: '#1976d2' }}>
                          食譜連結
                        </a>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openModal(item)} style={{ border: 'none', background: 'transparent', color: '#1976d2', cursor: 'pointer' }}>
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => deleteRecipe(item.id)} style={{ border: 'none', background: 'transparent', color: '#d32f2f', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>{activeModal === 'add' ? '新增菜色' : '編輯菜色'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>菜色名稱 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                  placeholder="例如：番茄炒蛋"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>菜色照片</label>
                {formData.imageUrl && (
                  <div style={{ marginBottom: '8px' }}>
                    <img src={getFullImageUrl(formData.imageUrl)} alt="Preview" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px' }} />
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <label style={{ flex: 1, padding: '8px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                    <Upload size={16} /> {uploading ? '上傳中...' : '從手機/電腦上傳照片'}
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
                  </label>
                </div>

                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box', fontSize: '12px' }}
                  placeholder="或直接貼上圖片網址 (https://...)"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>食譜網址 (選填)</label>
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={e => setFormData({ ...formData, sourceUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                  placeholder="https://cookpad.com/..."
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '6px' }}>取消</button>
                <button type="submit" disabled={uploading} style={{ padding: '8px 16px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '6px' }}>
                  {activeModal === 'add' ? '儲存新增' : '更新資料'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}