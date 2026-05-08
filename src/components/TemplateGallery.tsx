import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Check, Sparkles } from 'lucide-react';
import type { SavedFunction } from '../types';
import { templateCategories } from '../data/templates';
import { v4 as uuidv4 } from 'uuid';

interface TemplateGalleryProps {
  existingFunctionIds: Set<string>;
  onAddTemplate: (fn: SavedFunction) => void;
  onRunTemplate: (fn: SavedFunction) => void;
}

export default function TemplateGallery({
  existingFunctionIds,
  onAddTemplate,
  onRunTemplate,
}: TemplateGalleryProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('finance');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAdd = (template: SavedFunction) => {
    // Create a copy with new unique IDs so each addition is independent
    const now = Date.now();
    const newFn: SavedFunction = {
      ...template,
      id: uuidv4(),
      variables: template.variables.map(v => ({ ...v, id: uuidv4() })),
      outputs: template.outputs.map(o => ({ ...o, id: uuidv4() })),
      createdAt: now,
      updatedAt: now,
    };
    onAddTemplate(newFn);
    setAddedIds(prev => new Set(prev).add(template.id));
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(prev => (prev === categoryId ? null : categoryId));
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-2 shadow-md shadow-amber-200">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Pre-Built Calculators</h2>
          <p className="text-xs text-gray-400">Add ready-made calculators or try them instantly</p>
        </div>
      </div>

      {/* Category Accordion */}
      <div className="space-y-3">
        {templateCategories.map(category => {
          const isExpanded = expandedCategory === category.id;
          return (
            <div
              key={category.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <span className="text-sm font-bold text-gray-800">{category.name}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      {category.templates.length} template{category.templates.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Templates List */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {category.templates.map(template => {
                    const alreadyAdded = existingFunctionIds.has(template.id) || addedIds.has(template.id);
                    return (
                      <div
                        key={template.id}
                        className="rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all"
                      >
                        {/* Color accent bar */}
                        <div className={`h-1 bg-gradient-to-r ${template.color}`} />
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-800 text-sm">{template.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{template.description}</p>
                              
                              {/* Inputs/Outputs summary */}
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <span className="text-xs px-2 py-0.5 rounded-md bg-violet-50 text-violet-600 border border-violet-100">
                                  📥 {template.variables.length} input{template.variables.length !== 1 ? 's' : ''}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                                  📤 {template.outputs.length} output{template.outputs.length !== 1 ? 's' : ''}
                                </span>
                              </div>

                              {/* Outputs preview */}
                              <div className="mt-2 flex flex-wrap gap-1">
                                {template.outputs.slice(0, 4).map(o => (
                                  <span key={o.id} className="text-xs font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                    {o.label || o.name}
                                  </span>
                                ))}
                                {template.outputs.length > 4 && (
                                  <span className="text-xs text-gray-400">+{template.outputs.length - 4}</span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 shrink-0">
                              <button
                                onClick={() => onRunTemplate(template)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r ${template.color} text-white text-xs font-semibold shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all`}
                              >
                                Try It
                              </button>
                              <button
                                onClick={() => handleAdd(template)}
                                disabled={alreadyAdded}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  alreadyAdded
                                    ? 'bg-green-50 text-green-600 border border-green-200'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50'
                                }`}
                              >
                                {alreadyAdded ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    Added
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3 h-3" />
                                    Save
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
