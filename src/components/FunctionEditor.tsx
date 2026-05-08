import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save, X, Sparkles, Info, ChevronUp, ChevronDown } from 'lucide-react';
import type { SavedFunction, Variable, Output } from '../types';
import { evaluateFormula } from '../utils/evaluate';
import FormulaInput from './FormulaInput';

const COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
  'from-lime-500 to-green-600',
];

interface FunctionEditorProps {
  editingFunction: SavedFunction | null;
  onSave: (fn: SavedFunction) => void;
  onCancel: () => void;
}

export default function FunctionEditor({ editingFunction, onSave, onCancel }: FunctionEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [variables, setVariables] = useState<Variable[]>([]);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [color, setColor] = useState(COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [outputPreviews, setOutputPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingFunction) {
      setName(editingFunction.name);
      setDescription(editingFunction.description);
      setVariables(editingFunction.variables || []);
      setOutputs(editingFunction.outputs || []);
      setColor(editingFunction.color);
    }
  }, [editingFunction]);

  // Build suggestions for autocomplete
  const getSuggestionsForOutput = (currentOutputIndex: number) => {
    const suggestions: Array<{ name: string; type: 'variable' | 'output'; label?: string }> = [];
    
    // Add all variables
    variables.forEach(v => {
      if (v.name.trim()) {
        suggestions.push({ name: v.name, type: 'variable', label: v.label });
      }
    });
    
    // Add all outputs that come BEFORE this one
    outputs.slice(0, currentOutputIndex).forEach(o => {
      if (o.name.trim()) {
        suggestions.push({ name: o.name, type: 'output', label: o.label });
      }
    });
    
    return suggestions;
  };

  // Live preview for outputs - with chaining support
  useEffect(() => {
    const values: Record<string, number> = {};
    variables.forEach(v => { values[v.id] = v.defaultValue; });

    const previews: Record<string, string> = {};
    const computedOutputs: Array<{ name: string; value: number }> = [];

    outputs.forEach(output => {
      if (output.formula.trim()) {
        const result = evaluateFormula(output.formula, variables, values, computedOutputs);
        if (result.error) {
          previews[output.id] = `Error: ${result.error}`;
        } else {
          previews[output.id] = `= ${result.value}`;
          // Add to computed outputs for chaining
          if (output.name.trim() && result.value !== null) {
            computedOutputs.push({ name: output.name, value: result.value });
          }
        }
      }
    });
    setOutputPreviews(previews);
  }, [variables, outputs]);

  // --- Variable handlers ---
  const addVariable = () => {
    setVariables(prev => [
      ...prev,
      { id: uuidv4(), name: '', label: '', defaultValue: 0 },
    ]);
  };

  const updateVariable = (id: string, field: keyof Variable, value: string | number) => {
    setVariables(prev =>
      prev.map(v => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const removeVariable = (id: string) => {
    setVariables(prev => prev.filter(v => v.id !== id));
  };

  // --- Output handlers ---
  const addOutput = () => {
    setOutputs(prev => [
      ...prev,
      { id: uuidv4(), name: '', label: '', formula: '' },
    ]);
  };

  const updateOutput = (id: string, field: keyof Output, value: string) => {
    setOutputs(prev =>
      prev.map(o => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const removeOutput = (id: string) => {
    setOutputs(prev => prev.filter(o => o.id !== id));
  };

  const moveOutput = (id: string, direction: 'up' | 'down') => {
    setOutputs(prev => {
      const idx = prev.findIndex(o => o.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  // --- Validation ---
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';

    // Variables - case insensitive duplicate check
    variables.forEach(v => {
      if (!v.name.trim()) newErrors[`var_name_${v.id}`] = 'Required';
      if (!v.label.trim()) newErrors[`var_label_${v.id}`] = 'Required';
    });
    const varNames = variables.map(v => v.name.trim().toLowerCase());
    const seen = new Set<string>();
    varNames.forEach((n, i) => {
      if (n && seen.has(n)) newErrors[`var_name_${variables[i].id}`] = 'Duplicate';
      seen.add(n);
    });

    // Outputs
    if (outputs.length === 0) {
      newErrors.outputs = 'At least one output is required';
    }
    outputs.forEach(o => {
      if (!o.name.trim()) newErrors[`output_name_${o.id}`] = 'Required';
      if (!o.formula.trim()) newErrors[`output_formula_${o.id}`] = 'Required';
    });
    
    // Output names - case insensitive duplicate check
    const outputNames = outputs.map(o => o.name.trim().toLowerCase());
    const seenOutputs = new Set<string>();
    outputNames.forEach((n, i) => {
      if (n && seenOutputs.has(n)) newErrors[`output_name_${outputs[i].id}`] = 'Duplicate';
      // Also check against variable names (case insensitive)
      if (n && varNames.includes(n)) newErrors[`output_name_${outputs[i].id}`] = 'Conflicts with input';
      seenOutputs.add(n);
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const now = Date.now();
    const fn: SavedFunction = {
      id: editingFunction?.id || uuidv4(),
      name: name.trim(),
      description: description.trim(),
      variables,
      outputs,
      createdAt: editingFunction?.createdAt || now,
      updatedAt: now,
      color,
    };
    onSave(fn);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${color} p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {editingFunction ? 'Edit Function' : 'Create New Function'}
              </h2>
            </div>
            <button onClick={onCancel} className="text-white/70 hover:text-white transition-colors p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Color Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Theme Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${c} transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Name & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Function Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Invoice Calculator"
                className={`w-full rounded-xl border ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'} px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this function calculate?"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
              />
            </div>
          </div>

          {/* =================== INPUT VARIABLES =================== */}
          <div className="border border-violet-200 bg-violet-50/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📥</span>
                <label className="text-sm font-bold text-violet-800">Input Variables</label>
                <span className="text-xs text-violet-500">(case-insensitive)</span>
              </div>
              <button
                onClick={addVariable}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors bg-white px-3 py-1.5 rounded-lg border border-violet-200 hover:border-violet-300"
              >
                <Plus className="w-4 h-4" /> Add Input
              </button>
            </div>

            {variables.length === 0 && (
              <div className="text-center py-6 bg-white/60 rounded-xl border-2 border-dashed border-violet-200">
                <p className="text-violet-400 text-sm">No input variables yet. Add the values your formulas will use.</p>
              </div>
            )}

            <div className="space-y-2">
              {variables.map((variable, idx) => (
                <div key={variable.id} className="flex flex-col sm:flex-row gap-2 p-3 bg-white rounded-xl border border-violet-100 shadow-sm">
                  <div className="flex items-center justify-center w-7 h-7 bg-violet-100 text-violet-600 rounded-lg text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <input
                        type="text"
                        value={variable.name}
                        onChange={(e) => updateVariable(variable.id, 'name', e.target.value.replace(/\s/g, ''))}
                        placeholder="name (e.g., price)"
                        className={`w-full rounded-lg border ${errors[`var_name_${variable.id}`] ? 'border-red-400 bg-red-50' : 'border-gray-200'} px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all`}
                      />
                      {errors[`var_name_${variable.id}`] && <p className="text-red-500 text-xs mt-0.5">{errors[`var_name_${variable.id}`]}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={variable.label}
                        onChange={(e) => updateVariable(variable.id, 'label', e.target.value)}
                        placeholder="Label (e.g., Unit Price)"
                        className={`w-full rounded-lg border ${errors[`var_label_${variable.id}`] ? 'border-red-400 bg-red-50' : 'border-gray-200'} px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all`}
                      />
                      {errors[`var_label_${variable.id}`] && <p className="text-red-500 text-xs mt-0.5">{errors[`var_label_${variable.id}`]}</p>}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={variable.defaultValue}
                        onChange={(e) => updateVariable(variable.id, 'defaultValue', parseFloat(e.target.value) || 0)}
                        placeholder="Default"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all"
                      />
                      <button onClick={() => removeVariable(variable.id)} className="shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =================== OUTPUT FORMULAS =================== */}
          <div className="border border-emerald-200 bg-emerald-50/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📤</span>
                <label className="text-sm font-bold text-emerald-800">Output Formulas</label>
                <span className="text-xs text-emerald-500">(can reference earlier outputs)</span>
                {errors.outputs && <span className="text-red-500 text-xs ml-2">{errors.outputs}</span>}
              </div>
              <button
                onClick={addOutput}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors bg-white px-3 py-1.5 rounded-lg border border-emerald-200 hover:border-emerald-300"
              >
                <Plus className="w-4 h-4" /> Add Output
              </button>
            </div>

            {outputs.length === 0 && (
              <div className="text-center py-6 bg-white/60 rounded-xl border-2 border-dashed border-emerald-200">
                <p className="text-emerald-400 text-sm">No outputs yet. Add formulas that will calculate results from your inputs.</p>
              </div>
            )}

            <div className="space-y-3">
              {outputs.map((output, idx) => {
                const preview = outputPreviews[output.id];
                const suggestions = getSuggestionsForOutput(idx);
                return (
                  <div key={output.id} className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-0.5 mt-1">
                        <button
                          onClick={() => moveOutput(output.id, 'up')}
                          disabled={idx === 0}
                          className="text-emerald-400 hover:text-emerald-600 disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveOutput(output.id, 'down')}
                          disabled={idx === outputs.length - 1}
                          className="text-emerald-400 hover:text-emerald-600 disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md shrink-0">
                        Output {idx + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            value={output.name}
                            onChange={(e) => updateOutput(output.id, 'name', e.target.value.replace(/\s/g, ''))}
                            placeholder="name (e.g., total)"
                            className={`w-full rounded-lg border ${errors[`output_name_${output.id}`] ? 'border-red-400 bg-red-50' : 'border-gray-200'} px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all`}
                          />
                          {errors[`output_name_${output.id}`] && <p className="text-red-500 text-xs mt-0.5">{errors[`output_name_${output.id}`]}</p>}
                        </div>
                        <div>
                          <input
                            type="text"
                            value={output.label}
                            onChange={(e) => updateOutput(output.id, 'label', e.target.value)}
                            placeholder="Label (e.g., Total Amount)"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all"
                          />
                        </div>
                      </div>
                      <button onClick={() => removeOutput(output.id)} className="shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="ml-8">
                      <FormulaInput
                        value={output.formula}
                        onChange={(value) => updateOutput(output.id, 'formula', value)}
                        suggestions={suggestions}
                        placeholder="Formula (e.g., price * quantity) - start typing for suggestions"
                        hasError={!!errors[`output_formula_${output.id}`]}
                      />
                      {errors[`output_formula_${output.id}`] && <p className="text-red-500 text-xs mt-0.5">{errors[`output_formula_${output.id}`]}</p>}
                      {preview && (
                        <p className={`text-xs font-mono mt-1.5 ${preview.startsWith('Error') ? 'text-red-500' : 'text-emerald-600'}`}>
                          Preview: {preview}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Available names hint */}
            {(variables.filter(v => v.name).length > 0 || outputs.filter(o => o.name).length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-gray-500">Available names:</span>
                {variables.filter(v => v.name).map(v => (
                  <span key={v.id} className="text-xs px-2 py-0.5 bg-violet-50 text-violet-700 rounded-md border border-violet-100 font-mono">
                    {v.name}
                  </span>
                ))}
                {outputs.filter(o => o.name).map(o => (
                  <span key={o.id} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 font-mono">
                    {o.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Help */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700 space-y-1">
                <p className="font-semibold">Formula Tips:</p>
                <p>• Names are <strong>case-insensitive</strong>: <code className="bg-blue-100 px-1 rounded">Price</code>, <code className="bg-blue-100 px-1 rounded">PRICE</code>, <code className="bg-blue-100 px-1 rounded">price</code> all work</p>
                <p>• Outputs can reference <strong>earlier outputs</strong>: e.g., <code className="bg-blue-100 px-1 rounded">subtotal</code> in <code className="bg-blue-100 px-1 rounded">total = subtotal + tax</code></p>
                <p>• Start typing for <strong>autocomplete suggestions</strong></p>
                <p>• Operators: <code className="bg-blue-100 px-1 rounded">+</code> <code className="bg-blue-100 px-1 rounded">-</code> <code className="bg-blue-100 px-1 rounded">*</code> <code className="bg-blue-100 px-1 rounded">/</code> <code className="bg-blue-100 px-1 rounded">%</code></p>
                <p>• Functions: <code className="bg-blue-100 px-1 rounded">sqrt</code> <code className="bg-blue-100 px-1 rounded">pow</code> <code className="bg-blue-100 px-1 rounded">abs</code> <code className="bg-blue-100 px-1 rounded">round</code> <code className="bg-blue-100 px-1 rounded">floor</code> <code className="bg-blue-100 px-1 rounded">ceil</code> <code className="bg-blue-100 px-1 rounded">min</code> <code className="bg-blue-100 px-1 rounded">max</code> <code className="bg-blue-100 px-1 rounded">sin</code> <code className="bg-blue-100 px-1 rounded">cos</code> <code className="bg-blue-100 px-1 rounded">tan</code> <code className="bg-blue-100 px-1 rounded">log</code></p>
              </div>
            </div>
          </div>

          {/* =================== ACTIONS =================== */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className={`flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r ${color} text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all`}
            >
              <Save className="w-5 h-5" />
              {editingFunction ? 'Update Function' : 'Save Function'}
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
