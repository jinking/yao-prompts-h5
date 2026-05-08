import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { Search, Heart, Copy, Share2, ArrowLeft, RefreshCw, ChevronRight, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCatalog, getCategories } from './utils/catalog';
import { parsePromptMarkdown } from './utils/promptParser';
import bundleData from './data/bundle.json';
import './App.css';

// --- Components ---

const Navbar = ({ activeTab }) => {
  const navigate = useNavigate();
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass z-50 flex justify-around items-center py-2 px-4 pb-safe border-t border-slate-200">
      <Link to="/" className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'discover' ? 'text-indigo-600' : 'text-slate-400'}`}>
        <Search size={24} />
        <span className="text-[10px] font-medium">发现</span>
      </Link>
      <Link to="/favorites" className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'favorites' ? 'text-indigo-600' : 'text-slate-400'}`}>
        <Heart size={24} />
        <span className="text-[10px] font-medium">收藏</span>
      </Link>
      <a href="https://github.com/yaojingang/yao-open-prompts" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 text-slate-400">
        <Github size={24} />
        <span className="text-[10px] font-medium">开源</span>
      </a>
    </nav>
  );
};

const Header = ({ query, setQuery, itemCount }) => {
  return (
    <header className="px-6 pt-12 pb-6 bg-slate-900/50">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-2"
      >
        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wider border border-indigo-600/30">Protocol v1.0</span>
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="text-3xl font-black tracking-tight text-slate-900 mb-2"
      >
        精选提示词
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-slate-500 text-sm mb-8"
      >
        Directory · Preview · Copy · Execute
      </motion.p>
      
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SEARCH_COMMAND..."
          className="w-full pl-12 pr-28 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-1 focus:ring-indigo-600 transition-all outline-none"
        />
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-lg border border-indigo-600/30 backdrop-blur-sm">{itemCount} UNITS</span>
        </div>
      </div>
    </header>
  );
};

const Categories = ({ categories, activeCategory, onSelect }) => {
  return (
    <div className="overflow-x-auto no-scrollbar px-6 mb-8 -mx-0">
      <div className="flex gap-2 min-w-max pb-2">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => onSelect(cat.name)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              activeCategory === cat.name 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.name} <span className={activeCategory === cat.name ? 'text-indigo-100' : 'text-slate-400'}>{cat.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const PromptCard = ({ item, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(item)}
      className="p-5 bg-slate-800/40 border border-indigo-600/10 rounded-3xl shadow-sm hover:shadow-indigo-600/10 hover:border-indigo-600/30 transition-all cursor-pointer group mb-4 mx-6 backdrop-blur-sm"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">{item.mainTag}</span>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2 leading-snug group-hover:text-indigo-600 transition-colors">{item.title}</h3>
      <p className="text-xs text-slate-400 font-medium">{item.category} · {item.subcategory}</p>
    </motion.div>
  );
};

// --- Pages ---

const DiscoverPage = ({ items, query, setQuery, activeCategory, setActiveCategory }) => {
  const navigate = useNavigate();

  const categories = useMemo(() => {
    return [{ name: "全部", count: items.length }, ...getCategories(items)];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (activeCategory !== '全部' && it.category !== activeCategory) return false;
      if (!q) return true;
      const hay = `${it.title} ${it.subcategory} ${it.mainTag}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, activeCategory]);

  return (
    <div className="pb-32 min-h-screen bg-slate-900">
      <Header query={query} setQuery={setQuery} itemCount={filtered.length} />
      <Categories categories={categories} activeCategory={activeCategory} onSelect={setActiveCategory} />
      
      <div className="flex flex-col">
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => (
            <PromptCard key={item.id} item={item} onClick={(it) => navigate(`/detail/${it.id}`)} />
          ))}
        </AnimatePresence>
      </div>
      
      <Navbar activeTab="discover" />
    </div>
  );
};

const FavoritesPage = ({ items }) => {
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('yao_favorites') || '[]');
    setFavorites(items.filter(it => stored.includes(it.id)));
  }, [items]);

  return (
    <div className="pb-32 min-h-screen bg-slate-50">
      <header className="px-6 pt-16 pb-8 bg-slate-900 border-b border-indigo-600/10">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-1">我的收藏</h1>
        <p className="text-slate-500 text-sm">已收藏 {favorites.length} 个 Prompt</p>
      </header>
      
      <div className="mt-8">
        {favorites.length > 0 ? (
          favorites.map((item) => (
            <PromptCard key={item.id} item={item} onClick={(it) => navigate(`/detail/${it.id}`)} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-200 shadow-sm mb-4">
              <Heart size={32} />
            </div>
            <p className="text-slate-400 text-sm mb-6">暂时还没有收藏的内容</p>
            <Link to="/" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
              去发现
            </Link>
          </div>
        )}
      </div>
      
      <Navbar activeTab="favorites" />
    </div>
  );
};

const DetailPage = ({ items }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [copied, setCopied] = useState(false);

  const item = items.find(it => it.id === id);

  useEffect(() => {
    if (!item) return;
    
    const favs = JSON.parse(localStorage.getItem('yao_favorites') || '[]');
    setIsFav(favs.includes(item.id));

    const loadContent = async () => {
      // 1. Try Bundled Data (Instant)
      if (bundleData[item.id]) {
        const parsed = parsePromptMarkdown(bundleData[item.id].content);
        setData(parsed);
        setLoading(false);
        return;
      }

      // 2. Try Cache
      const cacheKey = `prompt_cache_${item.id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setData(JSON.parse(cached));
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      // 3. Fetch from CDN (Fallback)
      setLoading(true);
      try {
        const res = await fetch(item.rawUrl);
        const md = await res.text();
        const parsed = parsePromptMarkdown(md);
        setData(parsed);
        // Save to Cache
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [item]);

  const toggleFav = () => {
    const favs = JSON.parse(localStorage.getItem('yao_favorites') || '[]');
    let next;
    if (favs.includes(item.id)) {
      next = favs.filter(i => i !== item.id);
    } else {
      next = [...favs, item.id];
    }
    localStorage.setItem('yao_favorites', JSON.stringify(next));
    setIsFav(next.includes(item.id));
  };

  const copyToClipboard = () => {
    if (!data?.prompt) return;
    navigator.clipboard.writeText(data.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!item) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 z-[60] bg-slate-950 overflow-y-auto no-scrollbar"
    >
      <div className="sticky top-0 left-0 right-0 glass px-4 py-4 flex justify-between items-center z-10 border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all">
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-1">
          <button onClick={toggleFav} className={`p-2 rounded-full transition-all ${isFav ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Heart size={22} fill={isFav ? "currentColor" : "none"} />
          </button>
          <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all">
            <Share2 size={22} />
          </button>
        </div>
      </div>

      <div className="p-6 pb-32 max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
             <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md">{item.category}</span>
             <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-md">{item.subcategory}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-4 leading-tight">{item.title}</h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <RefreshCw size={32} className="animate-spin mb-4" />
            <p className="text-sm font-medium">加载中...</p>
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in">
            {data?.intro && (
              <section>
                <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">SYSTEM_INTRO</h2>
                <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-slate-100 p-6 rounded-3xl border border-indigo-600/10">
                  {data.intro}
                </div>
              </section>
            )}

            {data?.prompt && (
              <section className="relative">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest">COMMAND_PROMPT</h2>
                  <button 
                    onClick={copyToClipboard}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      copied ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                    }`}
                  >
                    {copied ? 'COPIED' : <><Copy size={14} /> COPY</>}
                  </button>
                </div>
                <div className="bg-slate-900 rounded-3xl p-6 text-indigo-100 text-sm leading-relaxed overflow-x-auto border border-indigo-600/20 shadow-2xl shadow-indigo-900/20">
                  <pre className="whitespace-pre-wrap font-mono">{data.prompt}</pre>
                </div>
              </section>
            )}
            
            <div className="pt-8 border-t border-slate-100 flex justify-center">
              <a 
                href={item.webUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium"
              >
                在 GitHub 上查看源码 <Share2 size={12} />
              </a>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  
  // Persist discovery state
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  useEffect(() => {
    const load = async () => {
      const data = await fetchCatalog();
      setItems(data);
      setReady(true);
    };
    load();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200"
        />
        <p className="mt-6 text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Yao Prompts</p>
      </div>
    );
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={
          <DiscoverPage 
            items={items} 
            query={query} 
            setQuery={setQuery} 
            activeCategory={activeCategory} 
            setActiveCategory={setActiveCategory} 
          />
        } />
        <Route path="/favorites" element={<FavoritesPage items={items} />} />
        <Route path="/detail/:id" element={<DetailPage items={items} />} />
      </Routes>
    </BrowserRouter>
  );
}
