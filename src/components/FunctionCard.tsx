import { Play, Pencil, Trash2, Clock } from 'lucide-react';
import type { SavedFunction } from '../types';

interface FunctionCardProps {
  fn: SavedFunction;
  onRun: (fn: SavedFunction) => void;
  onEdit: (fn: SavedFunction) => void;
  onDelete: (id: string) => void;
}

export default function FunctionCard({ fn, onRun, onEdit, onDelete }: FunctionCardProps) {
  const timeAgo = getTimeAgo(fn.updatedAt);
  const outputs = fn.outputs || [];

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1">
      {/* Color Bar */}
      <div className={`h-2 bg-gradient-to-r ${fn.color}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{fn.name}</h3>
            {fn.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{fn.description}</p>
            )}
          </div>
        </div>

        {/* Stats badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100">
            📥 {fn.variables.length} input{fn.variables.length !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            📤 {outputs.length} output{outputs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Outputs preview */}
        {outputs.length > 0 && (
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-4 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Outputs</p>
            <div className="space-y-1">
              {outputs.slice(0, 3).map((output) => (
                <p key={output.id} className="font-mono text-xs text-gray-600 truncate">
                  <span className="text-gray-400">{output.label || output.name}:</span> {output.formula}
                </p>
              ))}
              {outputs.length > 3 && (
                <p className="text-xs text-gray-400 italic">+{outputs.length - 3} more...</p>
              )}
            </div>
          </div>
        )}

        {/* Input Variables tags */}
        {fn.variables.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {fn.variables.map(v => (
              <span
                key={v.id}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-mono"
              >
                {v.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(fn); }}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(fn.id); }}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRun(fn)}
              className={`inline-flex items-center gap-1.5 ml-1 px-4 py-2 rounded-xl bg-gradient-to-r ${fn.color} text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all`}
            >
              <Play className="w-3.5 h-3.5" fill="currentColor" />
              Run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
