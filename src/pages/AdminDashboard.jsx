/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { LogOut, Plus, Trash2, X, Upload, LayoutGrid, Video, CheckCircle, Box, RefreshCw, Settings, FileText } from 'lucide-react';

// --- Sub-components (Memoized for Performance) ---

const LoadingOverlay = memo(() => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
));

const SidebarButton = memo(({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick} 
    className={`w-full text-right px-8 py-5 rounded-[25px] transition-all font-black flex items-center gap-4 ${active ? 'bg-accent text-white shadow-2xl shadow-accent/20 scale-[1.02]' : 'text-white/40 hover:bg-white/5 hover:text-white/60'}`}
  >
    <Icon size={20} /> {label}
  </button>
));

const AdminItemCard = memo(({ item: initialItem, table, onSave, onDelete, onUpload }) => {
  const [item, setItem] = useState(initialItem);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoMode, setVideoMode] = useState(initialItem.video_url?.includes('youtube') || initialItem.video_url?.includes('youtu.be') ? 'youtube' : 'upload');
  
  const isVideo = table === 'site_videos';
  const isContent = table === 'site_content';

  const handleChange = (field, value) => {
    setItem(prev => ({ ...prev, [field]: value }));
  };

  const handleLocalSave = async () => {
    setSaving(true);
    await onSave(table, item);
    setSaving(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    if (file.type !== 'video/mp4') {
      alert('الرجاء اختيار ملف بصيغة MP4 فقط');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('حجم الملف كبير جداً (الأقصى 50 ميجابايت)');
      return;
    }

    setUploadProgress(1);
    const url = await onUpload(file, 'videos', (progress) => {
      setUploadProgress(Math.round(progress));
    });

    if (url) {
      handleChange('video_url', url);
      setUploadProgress(0);
    } else {
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[40px] shadow-2xl flex flex-col transition-all hover:border-accent/30 hover:shadow-accent/5 group/card">
      <div className="space-y-6 flex-grow">
        {isVideo ? (
          <>
            <div>
              <label className="block text-xs font-black text-white/50 uppercase tracking-widest mb-2">اسم الصفحة</label>
              <input type="text" value={item.page_name || ''} onChange={e => handleChange('page_name', e.target.value)} className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 text-white outline-none focus:border-accent/50 transition-colors" />
            </div>

            <div className="flex bg-black/30 p-1 rounded-2xl">
              <button onClick={() => setVideoMode('upload')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${videoMode === 'upload' ? 'bg-accent text-white shadow-lg' : 'text-white/40'}`}>رفع فيديو</button>
              <button onClick={() => setVideoMode('youtube')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${videoMode === 'youtube' ? 'bg-accent text-white shadow-lg' : 'text-white/40'}`}>رابط YouTube</button>
            </div>

            {videoMode === 'upload' ? (
              <div className="space-y-4">
                <div className="relative">
                  <input type="file" accept="video/mp4" onChange={handleFileChange} className="hidden" id={`video-upload-${item.id || 'new'}`} />
                  <label htmlFor={`video-upload-${item.id || 'new'}`} className="flex items-center justify-center gap-3 w-full p-6 rounded-3xl bg-accent/5 border border-dashed border-accent/30 text-accent font-bold cursor-pointer hover:bg-accent/10 transition-all">
                    <Upload size={24} /> {uploadProgress > 0 ? `جاري الرفع (${uploadProgress}%)...` : 'اختر ملف MP4'}
                  </label>
                  {uploadProgress > 0 && (
                    <div className="absolute bottom-0 left-0 h-1 bg-accent transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                  )}
                </div>
                {item.video_url && !videoMode === 'youtube' && (
                   <div className="text-[10px] text-white/30 truncate px-2">{item.video_url}</div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-black text-white/50 uppercase tracking-widest mb-2">رابط يوتيوب</label>
                <input type="text" value={item.video_url || ''} onChange={e => handleChange('video_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 text-white outline-none focus:border-accent/50 transition-colors" />
              </div>
            )}

            {item.video_url && (
              <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 relative group/preview">
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity z-10">
                   <Video className="text-white/40" size={40} />
                </div>
                {videoMode === 'upload' ? (
                  <video src={item.video_url} className="w-full h-full object-cover" preload="metadata" />
                ) : (
                  <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                    <LayoutGrid className="text-accent opacity-20" size={40} />
                  </div>
                )}
              </div>
            )}
          </>
        ) : isContent ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-white/50 uppercase tracking-widest mb-2">المعرف (Key)</label>
                <div className="w-full p-4 rounded-2xl bg-black/30 border border-white/5 text-white/40 font-mono text-xs">{item.key}</div>
              </div>
              <div>
                <label className="block text-xs font-black text-white/50 uppercase tracking-widest mb-2">الصفحة</label>
                <div className="w-full p-4 rounded-2xl bg-black/30 border border-white/5 text-white/40 font-mono text-xs">{item.page}</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-white/50 uppercase tracking-widest mb-2">المحتوى</label>
              <textarea rows={4} value={item.content || ''} onChange={e => handleChange('content', e.target.value)} className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 text-white focus:border-accent outline-none resize-none transition-colors" />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-white/50 uppercase tracking-widest mb-2">اسم الباقة</label>
                <input type="text" value={item.plan_name || ''} onChange={e => handleChange('plan_name', e.target.value)} className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 text-white outline-none focus:border-accent/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-white/50 uppercase tracking-widest mb-2">ترتيب المجموعة</label>
                <input type="number" value={item.group_order || 1} onChange={e => handleChange('group_order', parseInt(e.target.value))} className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 text-white outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-xs font-black text-white/50 uppercase tracking-widest mb-2">ترتيب المدة (Sort)</label>
                <input type="number" value={item.sort_order || 0} onChange={e => handleChange('sort_order', parseInt(e.target.value))} className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 text-white outline-none focus:border-accent/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-white/50 uppercase tracking-widest mb-2">المدة</label>
                <input type="text" value={item.duration || ''} onChange={e => handleChange('duration', e.target.value)} className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 text-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-white/50 uppercase tracking-widest mb-2">السعر</label>
                <input type="text" value={item.price || ''} onChange={e => handleChange('price', e.target.value)} className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 text-white outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
              <input type="checkbox" checked={!!item.highlighted} onChange={e => handleChange('highlighted', e.target.checked)} className="w-5 h-5 accent-accent" />
              <label className="text-sm font-bold text-white/80">تمييز كأفضل قيمة</label>
            </div>
          </>
        )}
      </div>
      <div className="mt-8 pt-6 border-t border-white/10 flex gap-4">
        <button onClick={() => onDelete(item.id)} className="p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={22} /></button>
        <button onClick={handleLocalSave} disabled={saving} className="flex-1 bg-accent text-white font-black py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
          {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>
    </div>
  );
});

// --- Main Dashboard Component ---

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('TOD');
  const [data, setData] = useState({ pricing_plans: [], site_videos: [], site_content: [] });
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plans, videos, content] = await Promise.all([
        supabase.from('pricing_plans').select('*').order('group_order', { ascending: true }).order('sort_order', { ascending: true }),
        supabase.from('site_videos').select('*').order('updated_at', { ascending: false }),
        supabase.from('site_content').select('*').order('page', { ascending: true })
      ]);
      setData({ pricing_plans: plans.data || [], site_videos: videos.data || [], site_content: content.data || [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const checkUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setIsAuthenticated(true);
    setAuthLoading(false);
  }, []);

  useEffect(() => { checkUser(); }, [checkUser]);
  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated, fetchData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const adminEmail = email === 'dodgerstore' ? 'dodgerstore@admin.com' : email;
    const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password });
    if (error) { alert('بيانات الدخول غير صحيحة!'); setLoading(false); }
    else setIsAuthenticated(true);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setIsAuthenticated(false); };

  const handleFileUpload = useCallback(async (file, bucket, onProgress) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (error) throw error;

      // Simulate progress for UI feedback if needed, or just return
      if (onProgress) onProgress(100);

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return publicUrl;
    } catch (error) {
      console.error('Upload Error:', error);
      alert(`فشل الرفع: ${error.message}`);
      return null;
    }
  }, []);

  const handleSave = useCallback(async (table, item) => {
    const { id, ...updateData } = item;
    const res = id ? await supabase.from(table).update(updateData).eq('id', id) : await supabase.from(table).insert([updateData]);
    if (res.error) alert(res.error.message);
    else {
      setSuccessMessage('تم التحديث بنجاح! ✨');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditingItem(null);
      fetchData();
    }
  }, [fetchData]);

  const handleDelete = useCallback(async (table, id) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) alert(error.message); else fetchData();
    }
  }, [fetchData]);

  const displayItems = useMemo(() => {
    if (activeTab === 'TOD') return data.pricing_plans.filter(p => p.category.startsWith('TOD_'));
    if (activeTab === 'BEIN_NEW') return data.pricing_plans.filter(p => p.category === 'BEIN_NEW');
    if (activeTab === 'BEIN_RENEWAL') return data.pricing_plans.filter(p => p.category === 'BEIN_RENEWAL');
    if (activeTab === 'site_videos') return data.site_videos;
    if (activeTab === 'SITE_TEXTS') return data.site_content;
    return [];
  }, [activeTab, data]);

  if (authLoading) return <LoadingOverlay />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[150px]" /></div>
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleLogin} className="bg-white/5 p-12 rounded-[60px] w-full max-w-md backdrop-blur-3xl border border-white/10 shadow-2xl relative z-10" dir="rtl">
          <div className="text-center mb-10"><h2 className="text-4xl font-black text-white mb-2 text-glow">تسجيل الدخول</h2><p className="text-white/40 tracking-widest text-xs uppercase font-black">Dodger Admin</p></div>
          <div className="space-y-6">
            <input type="text" placeholder="اسم المستخدم" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-5 rounded-2xl bg-black/50 border border-white/10 text-white outline-none focus:border-accent transition-all" required />
            <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-5 rounded-2xl bg-black/50 border border-white/10 text-white outline-none focus:border-accent transition-all" required />
            <button type="submit" disabled={loading} className="w-full bg-accent text-white font-black py-5 rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all text-xl mt-4">{loading ? 'جاري التحقق...' : 'دخول النظام'}</button>
          </div>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row rtl" dir="rtl">
      {loading && <LoadingOverlay />}
      
      <div className="w-full md:w-80 bg-[#0d0d0d] border-l border-white/5 p-8 flex flex-col shadow-2xl relative z-50 md:sticky md:top-0 md:h-screen">
        <div className="mb-12 pr-4"><h1 className="text-2xl font-black text-glow">DODGER <span className="text-accent">STORE</span></h1></div>
        <nav className="flex-1 space-y-2">
          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 pr-4">إدارة الخطط</div>
          <SidebarButton active={activeTab === 'TOD'} onClick={() => setActiveTab('TOD')} icon={Box} label="باقات TOD" />
          <SidebarButton active={activeTab === 'BEIN_NEW'} onClick={() => setActiveTab('BEIN_NEW')} icon={RefreshCw} label="beIN جديد" />
          <SidebarButton active={activeTab === 'BEIN_RENEWAL'} onClick={() => setActiveTab('BEIN_RENEWAL')} icon={RefreshCw} label="beIN تجديد" />
          
          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-10 mb-4 pr-4">إدارة المحتوى</div>
          <SidebarButton active={activeTab === 'site_videos'} onClick={() => setActiveTab('site_videos')} icon={Video} label="الفيديوهات" />
          <SidebarButton active={activeTab === 'SITE_TEXTS'} onClick={() => setActiveTab('SITE_TEXTS')} icon={FileText} label="نصوص الموقع" />
          <SidebarButton active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} icon={Settings} label="الإعدادات" />
        </nav>
        <button onClick={handleLogout} className="mt-8 flex items-center justify-center gap-3 text-red-400/50 hover:text-red-400 px-6 py-4 rounded-2xl transition-all font-black border border-red-500/5 hover:border-red-500/20"><LogOut size={18} /> خروج</button>
      </div>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 px-4">
            <h2 className="text-4xl md:text-5xl font-black text-white text-glow">
              {activeTab === 'TOD' && 'باقات TOD'}
              {activeTab === 'BEIN_NEW' && 'أجهزة beIN'}
              {activeTab === 'BEIN_RENEWAL' && 'تجديد beIN'}
              {activeTab === 'site_videos' && 'الفيديوهات'}
              {activeTab === 'SITE_TEXTS' && 'نصوص الموقع'}
              {activeTab === 'SETTINGS' && 'إعدادات النظام'}
            </h2>
            {(activeTab !== 'SITE_TEXTS' && activeTab !== 'SETTINGS') && (
              <button onClick={() => setEditingItem({ category: activeTab === 'TOD' ? 'TOD_MOBILE' : activeTab, plan_name: '', duration: '', price: '', sort_order: 0, highlighted: false })} className="bg-accent text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Plus size={22} /> إضافة جديد</button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            <AnimatePresence mode="popLayout">
              {activeTab === 'SETTINGS' ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full bg-white/5 p-12 rounded-[50px] border border-white/10 text-center">
                  <Settings size={60} className="mx-auto mb-6 text-accent opacity-50" />
                  <h3 className="text-2xl font-black mb-4">إعدادات النظام</h3>
                  <p className="text-white/40 max-w-md mx-auto leading-relaxed">هنا يمكنك إدارة إعدادات الحساب وتفضيلات النظام الأساسية. الميزات المتقدمة ستتوفر قريباً.</p>
                </motion.div>
              ) : displayItems.map((item) => (
                <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                  <AdminItemCard item={item} table={activeTab === 'site_videos' ? 'site_videos' : (activeTab === 'SITE_TEXTS' ? 'site_content' : 'pricing_plans')} onSave={handleSave} onDelete={handleDelete} onUpload={handleFileUpload} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {editingItem && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[100] backdrop-blur-xl">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-[#121212] p-8 md:p-12 rounded-[60px] w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-10"><h2 className="text-3xl font-black text-white">إضافة عنصر جديد</h2><button onClick={() => setEditingItem(null)} className="p-3 bg-white/5 rounded-full hover:bg-white/10"><X size={24} /></button></div>
            <AdminItemCard item={editingItem} table={activeTab === 'site_videos' ? 'site_videos' : 'pricing_plans'} onSave={handleSave} onDelete={() => setEditingItem(null)} onUpload={handleFileUpload} />
          </motion.div>
        </div>
      )}
      <AnimatePresence>{successMessage && <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="fixed bottom-10 left-10 bg-accent text-white px-8 py-4 rounded-2xl shadow-2xl font-black flex items-center gap-4 z-[200] border border-white/20"><CheckCircle size={24} /> {successMessage}</motion.div>}</AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
