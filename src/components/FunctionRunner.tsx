import { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, RotateCcw, Copy, Check, FileText, FileDown } from 'lucide-react';
import type { SavedFunction, OutputResult } from '../types';
import { evaluateFunction } from '../utils/evaluate';
import { exportResultsToPDF, exportFormulasToPDF } from '../utils/pdfExport';

interface FunctionRunnerProps {
  fn: SavedFunction;
  onBack: () => void;
  onEdit: (fn: SavedFunction) => void;
}

export default function FunctionRunner({ fn, onBack, onEdit }: FunctionRunnerProps) {
  const [values, setValues] = useState<Record<string, number>>({});
  const [outputResults, setOutputResults] = useState<OutputResult[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ inputs: Record<string, number>; results: OutputResult[] }>>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const outputs = fn.outputs || [];

  useEffect(() => {
    const initial: Record<string, number> = {};
    fn.variables.forEach(v => { initial[v.id] = v.defaultValue; });
    setValues(initial);
    setOutputResults([]);
    setHasCalculated(false);
  }, [fn]);

  const handleCalculate = () => {
    const evalResult = evaluateFunction(fn, values);
    setOutputResults(evalResult.outputResults);
    setHasCalculated(true);
    
    // Add to history
    const hasValidResult = evalResult.outputResults.some(r => r.value !== null);
    if (hasValidResult) {
      setHistory(prev =>
        [{ inputs: { ...values }, results: evalResult.outputResults }, ...prev].slice(0, 10)
      );
    }
  };

  const handleReset = () => {
    const initial: Record<string, number> = {};
    fn.variables.forEach(v => { initial[v.id] = v.defaultValue; });
    setValues(initial);
    setOutputResults([]);
    setHasCalculated(false);
  };

  const handleCopyResult = (outputId: string, value: number) => {
    navigator.clipboard.writeText(String(value));
    setCopiedId(outputId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const loadFromHistory = (entry: { inputs: Record<string, number>; results: OutputResult[] }) => {
    setValues(entry.inputs);
    setOutputResults(entry.results);
    setHasCalculated(true);
  };

  const handleExportResults = () => {
    if (outputResults.length > 0) {
      exportResultsToPDF(fn, values, outputResults);
    }
    setShowExportMenu(false);
  };

  const handleExportFormulas = () => {
    exportFormulasToPDF(fn);
    setShowExportMenu(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${fn.color} p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">{fn.name}</h2>
                {fn.description && (
                  <p className="text-white/70 text-sm mt-0.5">{fn.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Export Button */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="text-white/70 hover:text-white text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                >
                  <FileDown className="w-4 h-4" />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-10">
                    <button
                      onClick={handleExportResults}
                      disabled={outputResults.length === 0}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-emerald-500" />
                      Export Results (PDF)
                    </button>
                    <button
                      onClick={handleExportFormulas}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-blue-500" />
                      Export Formulas (PDF)
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => onEdit(fn)}
                className="text-white/70 hover:text-white text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
              >
                Edit
              </button>
            </div>
          </div>

          {/* Output formulas summary */}
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
            <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">
              {outputs.length} Output{outputs.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-1">
              {outputs.map((output) => (
                <p key={output.id} className="text-white/90 font-mono text-xs">
                  <span className="text-white/50">{output.label || output.name}:</span> {output.formula}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Input Variables */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <span className="text-base">📥</span> Input Values
            </h3>
            {fn.variables.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No input variables defined.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fn.variables.map((variable) => (
                  <div key={variable.id} className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {variable.label}
                      <span className="text-gray-400 font-mono text-xs ml-2">({variable.name})</span>
                    </label>
                    <input
                      type="number"
                      value={values[variable.id] ?? variable.defaultValue}
                      onChange={(e) => {
                        setValues(prev => ({
                          ...prev,
                          [variable.id]: parseFloat(e.target.value) || 0,
                        }));
                      }}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all group-hover:border-gray-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCalculate}
              className={`flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r ${fn.color} text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all text-lg`}
            >
              <Calculator className="w-5 h-5" />
              Calculate
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-3.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all"
              title="Reset to defaults"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Output Results */}
          {hasCalculated && outputResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">📤</span> Results
              </h3>
              {outputResults.map((result) => (
                <div
                  key={result.outputId}
                  className={`rounded-2xl p-4 ${
                    result.error
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                        result.error ? 'text-red-500' : 'text-emerald-600'
                      }`}>
                        {result.label || result.name}
                      </p>
                      <p className="text-xs font-mono text-gray-400 mb-2">
                        {result.formula}
                      </p>
                    </div>
                    {!result.error && result.value !== null && (
                      <button
                        onClick={() => handleCopyResult(result.outputId, result.value!)}
                        className="text-emerald-500 hover:text-emerald-700 p-1.5 hover:bg-emerald-100 rounded-lg transition-all"
                        title="Copy result"
                      >
                        {copiedId === result.outputId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {result.error ? (
                    <p className="text-red-600 font-medium">{result.error}</p>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900 font-mono">{result.value}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Recent Calculations
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map((entry, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadFromHistory(entry)}
                    className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all"
                  >
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                      {fn.variables.map(v => (
                        <span key={v.id} className="bg-white px-2 py-0.5 rounded-md border border-gray-200">
                          {v.name} = <span className="font-mono font-medium text-gray-700">{entry.inputs[v.id]}</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {entry.results.filter(r => !r.error).map(r => (
                        <span key={r.outputId} className="text-sm font-mono text-emerald-700">
                          {r.name} = <span className="font-bold">{r.value}</span>
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowExportMenu(false)} />
      )}
    </div>
  );
}
