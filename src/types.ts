export interface Variable {
  id: string;
  name: string;
  label: string;
  defaultValue: number;
}

export interface Output {
  id: string;
  name: string;
  label: string;
  formula: string;
}

export interface SavedFunction {
  id: string;
  name: string;
  description: string;
  variables: Variable[];
  outputs: Output[];
  createdAt: number;
  updatedAt: number;
  color: string;
}

export interface OutputResult {
  outputId: string;
  name: string;
  label: string;
  formula: string;
  value: number | null;
  error: string | null;
}

export interface EvaluationResult {
  outputResults: OutputResult[];
}
