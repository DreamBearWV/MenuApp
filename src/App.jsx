import React, { useState, useEffect } from 'react';

const API_BASE = 'http://' + window.location.hostname + ':3000/api';

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [langMode, setLangMode] = useState('ALL'); // 'ZH', 'EN', 'ID', 'ALL'
  
  // 表單狀態
  const [form, setForm] = useState({
    id: null,
    name: '',
    nameEn: '',
    nameId: '',
    category: '主菜',
    imageUrl: '',
    sourceUrl: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const res = await fetch(`${API_BASE}/recipes`);
      const data = await res.json();
      setRecipes(data);
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
    }
  };

  // 一鍵 AI 自動翻譯 (中文 -> 英文 & 印尼文)
  const handleAutoTranslate = async () => {
    if (!form.name.trim()) {
      alert('請先輸入中文菜名！');
      return;
    }
    setIsTranslating(true);
    try {
      // 翻譯成英文
      const resEn = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(form.name)}&langpair=zh-TW|en`
      );
      const dataEn = await resEn.json();
      const translatedEn = dataEn.responseData?.translatedText || '';

      // 翻譯成印尼文
      const resId = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(form.name)}&langpair=zh-TW|id`
      );
      const dataId = await resId.json();
      const translatedId = dataId.responseData?.translatedText || '';

      setForm(prev => ({
        ...prev,
        nameEn: translatedEn,
        nameId: translatedId
      }));
    } catch (err) {
      console.error('Translation failed:', err);
      alert('翻譯服務暫時不可用，請手動填寫。');
    } finally {
      setIsTranslating(false);
    }
  };

  // 上傳圖片
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.imageUrl) {
        setForm(prev => ({ ...prev, imageUrl: data.imageUrl }));
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('圖片上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  // 提交新增/修改
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_BASE}/recipes/${form.id}` : `${API_BASE}/recipes`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        resetForm();
        fetchRecipes();
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  const handleEdit = (recipe) => {
    setForm({
      id: recipe.id,
      name: recipe.name,
      nameEn: recipe.nameEn || '',
      nameId: recipe.nameId || '',
      category: recipe.category || '主菜',
      imageUrl: recipe.imageUrl || '',
      sourceUrl: recipe.sourceUrl || ''
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除這道菜嗎？')) return;
    try {
      await fetch(`${API_BASE}/recipes/${id}`, { method: 'DELETE' });
      fetchRecipes();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleToggleOrder = async (id, currentStatus) => {
    try {
      await fetch(`${API_BASE}/recipes/${id}/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOrdered: !currentStatus })
      });
      fetchRecipes();
    } catch (err) {
      console.error('Toggle order error:', err);
    }
  };

  const handleResetOrders = async () => {
    if (!window.confirm('確定要清空今日點餐清單嗎？')) return;
    try {
      await fetch(`${API_BASE}/recipes/reset-orders`, { method: 'POST' });
      fetchRecipes();
    } catch (err) {
      console.error('Reset orders error:', err);
    }
  };

  const resetForm = () => {
    setForm({ id: null, name: '', nameEn: '', nameId: '', category: '主菜', imageUrl: '', sourceUrl: '' });
    setIsEditing(false);
  };

  const categories = ['全部', '主菜', '副菜', '湯品', '甜點', '其他'];
  const filteredRecipes = recipes.filter(r => 
    selectedCategory === '全部' ? true : r.category === selectedCategory
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🍳 家用三語點餐系統</h1>
        <button 
          onClick={handleResetOrders}
          style={{ padding: '8px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          🔄 重置今日點餐
        </button>
      </header>

      {/* 顯示語言切換器 */}
      <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>🌐 顯示語言：</span>
        {[
          { key: 'ALL', label: '三語對照' },
          { key: 'ZH', label: '中文' },
          { key: 'EN', label: 'English' },
          { key: 'ID', label: 'Bahasa Indonesia' },
        ].map(m => (
          <button
            key={m.key}
            onClick={() => setLangMode(m.key)}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              background: langMode === m.key ? '#2c3e50' : '#e0e0e0',
              color: langMode === m.key ? '#fff' : '#333',
              fontSize: '13px',
              fontWeight: langMode === m.key ? 'bold' : 'normal'
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 新增/編輯菜色表單 */}
      <form onSubmit={handleSubmit} style={{ background: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0 }}>{isEditing ? '✏️ 編輯菜色' : '➕ 新增菜色'}</h3>
        
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>中文菜名：</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                placeholder="例如：番茄炒蛋" 
                required 
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <button
                type="button"
                onClick={handleAutoTranslate}
                disabled={isTranslating}
                style={{ padding: '8px 12px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {isTranslating ? '⏳ 翻譯中...' : '🌐 自動翻譯'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#666' }}>英文 (English)：</label>
              <input 
                type="text" 
                value={form.nameEn} 
                onChange={e => setForm({ ...form, nameEn: e.target.value })} 
                placeholder="Scrambled Eggs with Tomatoes" 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#666' }}>印尼文 (Bahasa Indonesia)：</label>
              <input 
                type="text" 
                value={form.nameId} 
                onChange={e => setForm({ ...form, nameId: e.target.value })} 
                placeholder="Telur Orak-Arik Tomat" 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>分類：</label>
              <select 
                value={form.category} 
                onChange={e => setForm({ ...form, category: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                {categories.filter(c => c !== '全部').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>上傳圖片：</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ fontSize: '13px' }}
              />
              {uploading && <span style={{ fontSize: '12px', color: '#888' }}> 上傳中...</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" style={{ flex: 1, padding: '10px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {isEditing ? '更新菜色' : '新增菜色'}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} style={{ padding: '10px 20px', background: '#95a5a6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                取消
              </button>
            )}
          </div>
        </div>
      </form>

      {/* 分類頁籤 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid #3498db',
              background: selectedCategory === cat ? '#3498db' : '#fff',
              color: selectedCategory === cat ? '#fff' : '#3498db',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 菜色卡片列表 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
        {filteredRecipes.map(recipe => (
          <div 
            key={recipe.id} 
            style={{ 
              border: recipe.isOrdered ? '2px solid #2ecc71' : '1px solid #ddd', 
              borderRadius: '10px', 
              overflow: 'hidden', 
              background: recipe.isOrdered ? '#e8f8f5' : '#fff',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {recipe.imageUrl && (
              <img 
                src={recipe.imageUrl} 
                alt={recipe.name} 
                style={{ width: '100%', height: '160px', objectFit: 'cover' }} 
              />
            )}
            <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', background: '#eee', padding: '2px 8px', borderRadius: '4px', color: '#666' }}>
                  {recipe.category}
                </span>

                {/* 根據語言切換模式顯示菜名 */}
                <div style={{ marginTop: '8px' }}>
                  {(langMode === 'ALL' || langMode === 'ZH') && (
                    <h3 style={{ margin: '4px 0', fontSize: '18px' }}>{recipe.name}</h3>
                  )}
                  {(langMode === 'ALL' || langMode === 'EN') && recipe.nameEn && (
                    <div style={{ fontSize: '14px', color: '#555', fontStyle: 'italic' }}>
                      {recipe.nameEn}
                    </div>
                  )}
                  {(langMode === 'ALL' || langMode === 'ID') && recipe.nameId && (
                    <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '2px' }}>
                      🇮🇩 {recipe.nameId}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <button
                  onClick={() => handleToggleOrder(recipe.id, recipe.isOrdered)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    background: recipe.isOrdered ? '#2ecc71' : '#f1c40f',
                    color: recipe.isOrdered ? '#fff' : '#000',
                    marginBottom: '8px'
                  }}
                >
                  {recipe.isOrdered ? '✅ 已點選 (點擊取消)' : '➕ 點這道菜'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <button onClick={() => handleEdit(recipe)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer' }}>編輯</button>
                  <button onClick={() => handleDelete(recipe.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>刪除</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}