import type { Variable, SavedFunction, OutputResult, EvaluationResult } from '../types';

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replaces math function names and constants with JS equivalents.
 */
function replaceMathFunctions(expression: string): string {
  return expression
    .replace(/\blog10\b/gi, 'Math.log10')
    .replace(/\bsqrt\b/gi, 'Math.sqrt')
    .replace(/\babs\b/gi, 'Math.abs')
    .replace(/\bround\b/gi, 'Math.round')
    .replace(/\bfloor\b/gi, 'Math.floor')
    .replace(/\bceil\b/gi, 'Math.ceil')
    .replace(/\bmin\b/gi, 'Math.min')
    .replace(/\bmax\b/gi, 'Math.max')
    .replace(/\bpow\b/gi, 'Math.pow')
    .replace(/\batan2\b/gi, 'Math.atan2')
    .replace(/\batan\b/gi, 'Math.atan')
    .replace(/\basin\b/gi, 'Math.asin')
    .replace(/\bacos\b/gi, 'Math.acos')
    .replace(/\bsin\b/gi, 'Math.sin')
    .replace(/\bcos\b/gi, 'Math.cos')
    .replace(/\btan\b/gi, 'Math.tan')
    .replace(/\blog\b/gi, 'Math.log')
    .replace(/\bPI\b/gi, 'Math.PI')
    .replace(/\bE\b/gi, 'Math.E');
}

/**
 * Safety check for expressions
 */
function isSafe(expression: string): boolean {
  const dangerousPatterns = /\b(eval|function|return|import|require|window|document|fetch|XMLHttpRequest|process|alert|prompt|confirm)\b/i;
  return !dangerousPatterns.test(expression);
}

/**
 * Substitute named values (variables/outputs) into an expression string.
 * Case-insensitive matching.
 * Sorted by name length descending to avoid partial replacements.
 */
function substituteNames(
  expression: string,
  namedValues: Array<{ name: string; value: number }>
): string {
  const sorted = [...namedValues].sort((a, b) => b.name.length - a.name.length);
  let result = expression;
  for (const nv of sorted) {
    // Case-insensitive replacement
    const regex = new RegExp(`\\b${escapeRegExp(nv.name)}\\b`, 'gi');
    result = result.replace(regex, `(${nv.value})`);
  }
  return result;
}

/**
 * Evaluates a single expression string, returns number or error.
 */
function evalExpression(expression: string): { value: number | null; error: string | null } {
  try {
    if (!expression.trim()) {
      return { value: null, error: 'Expression is empty' };
    }

    const processed = replaceMathFunctions(expression);

    if (!isSafe(processed)) {
      return { value: null, error: 'Expression contains unsafe code' };
    }

    const result = new Function(`"use strict"; return (${processed})`)();

    if (typeof result !== 'number' || !isFinite(result)) {
      if (isNaN(result)) {
        return { value: null, error: 'Result is not a number (NaN)' };
      }
      return { value: null, error: 'Result is infinite' };
    }

    return { value: Math.round(result * 1000000) / 1000000, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Invalid expression';
    return { value: null, error: msg };
  }
}

/**
 * Evaluates all outputs of a function given input values.
 * Outputs are evaluated in order, so later outputs can reference earlier ones.
 * All name matching is case-insensitive.
 */
export function evaluateFunction(
  fn: SavedFunction,
  inputValues: Record<string, number>
): EvaluationResult {
  const outputResults: OutputResult[] = [];

  // Build initial scope from input variables
  const scope: Array<{ name: string; value: number }> = fn.variables.map(v => ({
    name: v.name.toLowerCase(),
    value: inputValues[v.id] ?? v.defaultValue,
  }));

  // Evaluate each output in order - each can use variables AND previous outputs
  const outputs = fn.outputs || [];
  for (const output of outputs) {
    if (!output.formula.trim()) {
      outputResults.push({
        outputId: output.id,
        name: output.name,
        label: output.label,
        formula: output.formula,
        value: null,
        error: 'Formula is empty',
      });
      continue;
    }

    // Substitute all known values (variables + computed outputs so far)
    const substituted = substituteNames(output.formula, scope);
    const result = evalExpression(substituted);

    outputResults.push({
      outputId: output.id,
      name: output.name,
      label: output.label,
      formula: output.formula,
      value: result.value,
      error: result.error,
    });

    // If successful, add this output to scope for subsequent outputs
    if (result.value !== null && output.name.trim()) {
      scope.push({ name: output.name.toLowerCase(), value: result.value });
    }
  }

  return { outputResults };
}

/**
 * Simple evaluate for a single formula (used for previews).
 * Also supports referencing other outputs that come before in the list.
 */
export function evaluateFormula(
  formula: string,
  variables: Variable[],
  values: Record<string, number>,
  previousOutputs?: Array<{ name: string; value: number }>
): { value: number | null; error: string | null } {
  if (!formula.trim()) {
    return { value: null, error: 'Formula is empty' };
  }

  // Build scope with variables
  const scope: Array<{ name: string; value: number }> = variables.map(v => ({
    name: v.name.toLowerCase(),
    value: values[v.id] ?? v.defaultValue,
  }));

  // Add previous outputs to scope
  if (previousOutputs) {
    for (const po of previousOutputs) {
      if (po.name.trim()) {
        scope.push({ name: po.name.toLowerCase(), value: po.value });
      }
    }
  }

  const substituted = substituteNames(formula, scope);
  return evalExpression(substituted);
}
