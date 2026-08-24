import React, { useState, useEffect } from 'react';

const API_BASE = 'http://' + window.location.hostname + ':3000/api';

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [lang, setLang] = useState('ALL'); // 'ZH', 'EN', 'ID', 'ALL'
  const [isWorkerMode, setIsWorkerMode] = useState(false); // 工人烹飪模式
  const [showModal, setShowModal] = useState(false); // 彈出式新增/編輯視窗控制

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
      const resEn = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(form.name)}&langpair=zh-TW|en`
      );
      const dataEn = await resEn.json();

      const resId = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(form.name)}&langpair=zh-TW|id`
      );
      const dataId = await resId.json();

      setForm(prev => ({
        ...prev,
        nameEn: dataEn.responseData?.translatedText || '',
        nameId: dataId.responseData?.translatedText || ''
      }));
    } catch (err) {
      console.error('Translation failed:', err);
      alert('翻譯服務暫時不可用，請手動填寫。');
    } finally {
      setIsTranslating(false);
    }
  };

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
        closeModal();
        fetchRecipes();
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  const openAddModal = () => {
    setForm({ id: null, name: '', nameEn: '', nameId: '', category: '主菜', imageUrl: '', sourceUrl: '' });
    setIsEditing(false);
    setShowModal(true);
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
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
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

  // 根據下拉選單的語言渲染菜名
  const renderRecipeName = (recipe) => {
    if (lang === 'ZH') return <h3 style={{ margin: '4px 0', fontSize: '18px' }}>{recipe.name}</h3>;
    if (lang === 'EN') return <h3 style={{ margin: '4px 0', fontSize: '18px' }}>{recipe.nameEn || recipe.name}</h3>;
    if (lang === 'ID') return <h3 style={{ margin: '4px 0', fontSize: '18px' }}>{recipe.nameId || recipe.name}</h3>;
    
    // ALL: 中英印三語對照
    return (
      <div>
        <h3 style={{ margin: '4px 0 2px 0', fontSize: '18px' }}>{recipe.name}</h3>
        {recipe.nameEn && <div style={{ fontSize: '13px', color: '#555' }}>🇬🇧 {recipe.nameEn}</div>}
        {recipe.nameId && <div style={{ fontSize: '13px', color: '#7f8c8d' }}>🇮🇩 {recipe.nameId}</div>}
      </div>
    );
  };

  const categories = ['全部', '主菜', '副菜', '湯品', '甜點', '其他'];
  const orderedRecipes = recipes.filter(r => r.isOrdered);
  const filteredRecipes = recipes.filter(r => 
    selectedCategory === '全部' ? true : r.category === selectedCategory
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
      
      {/* 頂部 Header */}
      <header style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>
            {isWorkerMode ? '👨‍🍳 工人烹飪模式' : '🍳 家庭點餐菜單'}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* 中英印語言選擇下拉選單 */}
            <select 
              value={lang} 
              onChange={e => setLang(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', background: '#fff', cursor: 'pointer' }}
            >
              <option value="ALL">🌐 中 / 英 / 印對照</option>
              <option value="ZH">繁體中文</option>
              <option value="EN">English</option>
              <option value="ID">Bahasa Indonesia</option>
            </select>

            {/* 切換模式按鈕 */}
            <button
              onClick={() => setIsWorkerMode(!isWorkerMode)}
              style={{ padding: '8px 14px', background: isWorkerMode ? '#34495e' : '#8e44ad', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isWorkerMode ? '📋 切換回點餐模式' : '👩‍🍳 切換至工人烹飪模式'}
            </button>
          </div>
        </div>

        {/* 點餐模式下的功能操作列 */}
        {!isWorkerMode && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <button
              onClick={openAddModal}
              style={{ padding: '8px 16px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ➕ 新增菜色
            </button>
            <button 
              onClick={handleResetOrders}
              style={{ padding: '8px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              🔄 重置今日點餐
            </button>
          </div>
        )}
      </header>

      {/* 工人烹飪模式（僅顯示已點選菜色） */}
      {isWorkerMode ? (
        <div>
          <h2 style={{ fontSize: '18px', color: '#27ae60', borderBottom: '2px solid #27ae60', paddingBottom: '8px' }}>
            📋 今日待烹飪菜單 ({orderedRecipes.length} 道)
          </h2>
          {orderedRecipes.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>今天還沒有選點任何菜色喔！</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', marginTop: '15px' }}>
              {orderedRecipes.map(recipe => (
                <div key={recipe.id} style={{ border: '2px solid #2ecc71', borderRadius: '10px', overflow: 'hidden', background: '#ffffff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                  {recipe.imageUrl && (
                    <img src={recipe.imageUrl} alt={recipe.name} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '15px' }}>
                    <span style={{ fontSize: '12px', background: '#e8f8f5', color: '#27ae60', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {recipe.category}
                    </span>
                    <div style={{ marginTop: '10px' }}>
                      {renderRecipeName(recipe)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 一般點餐模式 */
        <div>
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
                  <img src={recipe.imageUrl} alt={recipe.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                )}
                <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '11px', background: '#eee', padding: '2px 8px', borderRadius: '4px', color: '#666' }}>
                      {recipe.category}
                    </span>
                    <div style={{ marginTop: '8px' }}>
                      {renderRecipeName(recipe)}
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
      )}

      {/* 彈出式新增/編輯 Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            padding: '25px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              {isEditing ? '✏️ 編輯菜色' : '➕ 新增菜色'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>中文菜名：</label>
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

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>分類：</label>
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
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>上傳圖片：</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  style={{ fontSize: '13px' }}
                />
                {uploading && <span style={{ fontSize: '12px', color: '#888' }}> 上傳中...</span>}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {isEditing ? '更新菜色' : '確認新增'}
                </button>
                <button type="button" onClick={closeModal} style={{ padding: '10px 20px', background: '#95a5a6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}