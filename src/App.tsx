import { useState, useMemo } from 'react';
import { Plus, Search, FunctionSquare, Layers } from 'lucide-react';
import type { SavedFunction } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import FunctionEditor from './components/FunctionEditor';
import FunctionRunner from './components/FunctionRunner';
import FunctionCard from './components/FunctionCard';
import DeleteModal from './components/DeleteModal';
import TemplateGallery from './components/TemplateGallery';

type View = 'list' | 'editor' | 'runner';

export default function App() {
  const [functions, setFunctions] = useLocalStorage<SavedFunction[]>('mixc-functions-v1', []);
  const [view, setView] = useState<View>('list');
  const [editingFunction, setEditingFunction] = useState<SavedFunction | null>(null);
  const [runningFunction, setRunningFunction] = useState<SavedFunction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedFunction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Ensure backwards compatibility
  const normalizedFunctions = useMemo(() => {
    return functions.map(f => ({
      ...f,
      outputs: f.outputs || [],
    }));
  }, [functions]);

  const existingFunctionIds = useMemo(() => {
    return new Set(normalizedFunctions.map(f => f.id));
  }, [normalizedFunctions]);

  const filteredFunctions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedFunctions;
    const q = searchQuery.toLowerCase();
    return normalizedFunctions.filter(
      f => f.name.toLowerCase().includes(q) ||
           f.description.toLowerCase().includes(q) ||
           f.outputs.some(o => o.formula.toLowerCase().includes(q))
    );
  }, [normalizedFunctions, searchQuery]);

  const handleCreateNew = () => {
    setEditingFunction(null);
    setView('editor');
  };

  const handleEdit = (fn: SavedFunction) => {
    setEditingFunction(fn);
    setView('editor');
  };

  const handleRun = (fn: SavedFunction) => {
    setRunningFunction(fn);
    setView('runner');
  };

  const handleSave = (fn: SavedFunction) => {
    setFunctions(prev => {
      const exists = prev.find(f => f.id === fn.id);
      if (exists) {
        return prev.map(f => (f.id === fn.id ? fn : f));
      }
      return [fn, ...prev];
    });
    setView('list');
    setEditingFunction(null);
  };

  const handleDelete = (id: string) => {
    const fn = normalizedFunctions.find(f => f.id === id);
    if (fn) setDeleteTarget(fn);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      setFunctions(prev => prev.filter(f => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const handleCancel = () => {
    setView('list');
    setEditingFunction(null);
  };

  const handleBackFromRunner = () => {
    setView('list');
    setRunningFunction(null);
  };

  const handleEditFromRunner = (fn: SavedFunction) => {
    setRunningFunction(null);
    setEditingFunction(fn);
    setView('editor');
  };

  const handleAddTemplate = (fn: SavedFunction) => {
    setFunctions(prev => [fn, ...prev]);
  };

  const handleRunTemplate = (fn: SavedFunction) => {
    setRunningFunction(fn);
    setView('runner');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-violet-50">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setView('list'); setRunningFunction(null); setEditingFunction(null); }}
              className="flex items-center gap-3 group"
            >
              <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl p-2 shadow-lg shadow-violet-200 group-hover:shadow-violet-300 transition-shadow">
                <FunctionSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Mix C</h1>
                <p className="text-xs text-gray-400 -mt-0.5">Multi-Output Calculator</p>
              </div>
            </button>

            {view === 'list' && (
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">New Function</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {view === 'list' && (
          <div className="space-y-10">
            {/* Search & Stats */}
            {normalizedFunctions.length > 0 && (
              <div>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search your functions..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all shadow-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                    <Layers className="w-4 h-4" />
                    <span>{normalizedFunctions.length} function{normalizedFunctions.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* My Functions heading */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg p-1.5">
                    <FunctionSquare className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">My Functions</h2>
                </div>

                {/* Function Grid */}
                {filteredFunctions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFunctions.map(fn => (
                      <FunctionCard
                        key={fn.id}
                        fn={fn}
                        onRun={handleRun}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-gray-500">No matching functions</h3>
                    <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            )}

            {/* Empty State for My Functions */}
            {normalizedFunctions.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-2xl mb-4">
                  <FunctionSquare className="w-8 h-8 text-violet-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">No functions yet</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm">
                  Create your own or pick from the pre-built calculators below.
                </p>
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Custom Function
                </button>
              </div>
            )}

            {/* Pre-Built Calculators - always visible */}
            {!searchQuery.trim() && (
              <TemplateGallery
                existingFunctionIds={existingFunctionIds}
                onAddTemplate={handleAddTemplate}
                onRunTemplate={handleRunTemplate}
              />
            )}
          </div>
        )}

        {view === 'editor' && (
          <FunctionEditor
            editingFunction={editingFunction}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {view === 'runner' && runningFunction && (
          <FunctionRunner
            fn={runningFunction}
            onBack={handleBackFromRunner}
            onEdit={handleEditFromRunner}
          />
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal
          functionName={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
