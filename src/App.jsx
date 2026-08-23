import React, { useState, useEffect } from 'react';
import { ChefHat, Utensils, Plus, Trash2, ExternalLink, RefreshCw, CheckCircle2, Circle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecipe, setNewRecipe] = useState({ name: '', imageUrl: '', sourceUrl: '' });

  // 取得菜單資料
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

  // 切換點餐狀態
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
      alert('更新失敗，請檢查網路！');
    }
  };

  // 新增菜色
  const handleAddRecipe = async (e) => {
    e.preventDefault();
    if (!newRecipe.name.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecipe)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewRecipe({ name: '', imageUrl: '', sourceUrl: '' });
        fetchRecipes();
      }
    } catch (err) {
      alert('新增失敗！');
    }
  };

  // 重置今日點餐
  const resetOrders = async () => {
    if (!confirm('確定要清空今日所有點餐嗎？')) return;
    try {
      await fetch(`${API_BASE}/api/recipes/reset-orders`, { method: 'POST' });
      fetchRecipes();
    } catch (err) {
      alert('重置失敗！');
    }
  };

  // 刪除菜色
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
      {/* 頂部 Header & 模式切換 */}
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

      {/* 模式一：工人烹飪模式 (簡單清晰、卡片大、只顯示今日點餐) */}
      {isCookingMode ? (
        <div>
          <div style={{ background: '#fff3e0', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', color: '#e65100' }}>
            👨‍🍳 提示：以下為今日已點菜色，點擊連結可直接開啟烹飪教學食譜。
          </div>
          {orderedRecipes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>今日尚未點菜 (No dishes ordered today)</p>
          ) : (
            orderedRecipes.map(item => (
              <div key={item.id} style={{ border: '2px solid #ffe0b2', borderRadius: '12px', padding: '16px', marginBottom: '16px', background: '#fff' }}>
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} />
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
        /* 模式二：家庭點餐模式 */
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => setShowAddModal(true)}
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
                      <img src={item.imageUrl} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
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
                  <button onClick={() => deleteRecipe(item.id)} style={{ border: 'none', background: 'transparent', color: '#999', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 新增菜色 Modal 彈窗 */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '400px' }}>
            <h3>新增菜色</h3>
            <form onSubmit={handleAddRecipe}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>菜色名稱 *</label>
                <input
                  type="text"
                  required
                  value={newRecipe.name}
                  onChange={e => setNewRecipe({ ...newRecipe, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                  placeholder="例如：番茄炒蛋"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>圖片網址 (選填)</label>
                <input
                  type="url"
                  value={newRecipe.imageUrl}
                  onChange={e => setNewRecipe({ ...newRecipe, imageUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                  placeholder="https://..."
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>食譜網址 (選填)</label>
                <input
                  type="url"
                  value={newRecipe.sourceUrl}
                  onChange={e => setNewRecipe({ ...newRecipe, sourceUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                  placeholder="https://cookpad.com/..."
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '6px' }}>取消</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '6px' }}>儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}