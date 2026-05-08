import { useState, useRef, useEffect } from 'react';

interface Suggestion {
  name: string;
  type: 'variable' | 'output' | 'function';
  label?: string;
}

interface FormulaInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: Suggestion[];
  placeholder?: string;
  className?: string;
  hasError?: boolean;
}

const MATH_FUNCTIONS: Suggestion[] = [
  { name: 'sqrt', type: 'function', label: 'Square root' },
  { name: 'pow', type: 'function', label: 'Power (x, y)' },
  { name: 'abs', type: 'function', label: 'Absolute value' },
  { name: 'round', type: 'function', label: 'Round to nearest' },
  { name: 'floor', type: 'function', label: 'Round down' },
  { name: 'ceil', type: 'function', label: 'Round up' },
  { name: 'min', type: 'function', label: 'Minimum' },
  { name: 'max', type: 'function', label: 'Maximum' },
  { name: 'sin', type: 'function', label: 'Sine' },
  { name: 'cos', type: 'function', label: 'Cosine' },
  { name: 'tan', type: 'function', label: 'Tangent' },
  { name: 'asin', type: 'function', label: 'Arc sine' },
  { name: 'acos', type: 'function', label: 'Arc cosine' },
  { name: 'atan', type: 'function', label: 'Arc tangent' },
  { name: 'atan2', type: 'function', label: 'Arc tangent (y, x)' },
  { name: 'log', type: 'function', label: 'Natural log' },
  { name: 'log10', type: 'function', label: 'Log base 10' },
  { name: 'PI', type: 'function', label: '3.14159...' },
  { name: 'E', type: 'function', label: '2.71828...' },
];

export default function FormulaInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className = '',
  hasError = false,
}: FormulaInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setCursorWord] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const allSuggestions = [...suggestions, ...MATH_FUNCTIONS];

  // Extract the word at cursor position
  const getWordAtCursor = (text: string, pos: number): { word: string; start: number; end: number } => {
    const before = text.slice(0, pos);
    const after = text.slice(pos);
    
    // Find word boundary before cursor
    const beforeMatch = before.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    const wordBefore = beforeMatch ? beforeMatch[0] : '';
    const start = pos - wordBefore.length;
    
    // Find word boundary after cursor
    const afterMatch = after.match(/^[a-zA-Z0-9_]*/);
    const wordAfter = afterMatch ? afterMatch[0] : '';
    const end = pos + wordAfter.length;
    
    return { word: wordBefore + wordAfter, start, end };
  };

  // Update suggestions when value or cursor changes
  const updateSuggestions = (text: string, pos: number) => {
    const { word } = getWordAtCursor(text, pos);
    setCursorWord(word);
    setCursorPosition(pos);

    if (word.length >= 1) {
      const filtered = allSuggestions.filter(s =>
        s.name.toLowerCase().includes(word.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    onChange(newValue);
    updateSuggestions(newValue, pos);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (filteredSuggestions.length > 0) {
        e.preventDefault();
        insertSuggestion(filteredSuggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const insertSuggestion = (suggestion: Suggestion) => {
    const { start, end } = getWordAtCursor(value, cursorPosition);
    
    let insertText = suggestion.name;
    if (suggestion.type === 'function' && !['PI', 'E'].includes(suggestion.name)) {
      insertText = suggestion.name + '(';
    }
    
    const newValue = value.slice(0, start) + insertText + value.slice(end);
    onChange(newValue);
    setShowSuggestions(false);

    // Set cursor position after inserted text
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = start + insertText.length;
        inputRef.current.setSelectionRange(newPos, newPos);
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const pos = (e.target as HTMLInputElement).selectionStart || 0;
    updateSuggestions(value, pos);
  };

  const handleFocus = () => {
    if (inputRef.current) {
      const pos = inputRef.current.selectionStart || 0;
      updateSuggestions(value, pos);
    }
  };

  const handleBlur = () => {
    // Delay hiding to allow click on suggestion
    setTimeout(() => setShowSuggestions(false), 150);
  };

  // Scroll selected suggestion into view
  useEffect(() => {
    if (suggestionsRef.current && showSuggestions) {
      const selected = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, showSuggestions]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full rounded-lg border ${
          hasError ? 'border-red-400 bg-red-50' : 'border-gray-200'
        } px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all ${className}`}
        autoComplete="off"
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.name}`}
              type="button"
              className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                index === selectedIndex
                  ? 'bg-violet-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => insertSuggestion(suggestion)}
            >
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                suggestion.type === 'variable'
                  ? 'bg-violet-100 text-violet-700'
                  : suggestion.type === 'output'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {suggestion.type === 'variable' ? 'IN' : suggestion.type === 'output' ? 'OUT' : 'FN'}
              </span>
              <span className="font-mono text-sm text-gray-800">{suggestion.name}</span>
              {suggestion.label && (
                <span className="text-xs text-gray-400 ml-auto">{suggestion.label}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
