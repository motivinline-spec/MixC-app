import { jsPDF } from 'jspdf';
import type { SavedFunction, OutputResult } from '../types';

/**
 * Export calculation results to PDF
 */
export function exportResultsToPDF(
  fn: SavedFunction,
  inputValues: Record<string, number>,
  outputResults: OutputResult[]
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(fn.name, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Description
  if (fn.description) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(fn.description, pageWidth / 2, y, { align: 'center' });
    y += 10;
  }

  // Date
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Divider
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Input Variables Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('Input Values', 20, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);

  fn.variables.forEach(v => {
    const value = inputValues[v.id] ?? v.defaultValue;
    doc.text(`${v.label} (${v.name}):`, 25, y);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), pageWidth - 40, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 7;
  });

  y += 5;

  // Divider
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Output Results Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('Results', 20, y);
  y += 10;

  outputResults.forEach(result => {
    // Check for page break
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    // Output label and name
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40);
    doc.text(`${result.label || result.name}`, 25, y);
    y += 6;

    // Formula
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120);
    doc.text(`Formula: ${result.formula}`, 25, y);
    y += 6;

    // Result value
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    if (result.error) {
      doc.setTextColor(200, 50, 50);
      doc.text(`Error: ${result.error}`, 25, y);
    } else {
      doc.setTextColor(30, 120, 60);
      doc.text(`= ${result.value}`, 25, y);
    }
    y += 12;
  });

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  doc.setFontSize(8);
  doc.setTextColor(150);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Mix C - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  doc.save(`${fn.name.replace(/\s+/g, '_')}_results.pdf`);
}

/**
 * Export function formulas/definition to PDF
 */
export function exportFormulasToPDF(fn: SavedFunction): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(fn.name, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Description
  if (fn.description) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(fn.description, pageWidth / 2, y, { align: 'center' });
    y += 10;
  }

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 180);
  doc.text('Function Definition', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Date
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Exported: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Divider
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Input Variables Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('Input Variables', 20, y);
  y += 10;

  if (fn.variables.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    doc.text('No input variables defined', 25, y);
    y += 8;
  } else {
    fn.variables.forEach((v, idx) => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      doc.text(`${idx + 1}. `, 25, y);
      doc.setFont('helvetica', 'bold');
      doc.text(v.name, 32, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120);
      doc.text(` — ${v.label}`, 32 + doc.getTextWidth(v.name), y);
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`Default value: ${v.defaultValue}`, 32, y);
      y += 8;
    });
  }

  y += 5;

  // Divider
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Output Formulas Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('Output Formulas', 20, y);
  y += 10;

  const outputs = fn.outputs || [];
  if (outputs.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    doc.text('No output formulas defined', 25, y);
    y += 8;
  } else {
    outputs.forEach((output, idx) => {
      // Check for page break
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      // Output header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50);
      doc.text(`${idx + 1}. ${output.label || output.name}`, 25, y);
      y += 6;

      // Output name
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Variable name: ${output.name}`, 30, y);
      y += 6;

      // Formula box
      doc.setFillColor(245, 245, 250);
      doc.setDrawColor(200, 200, 220);
      const formulaText = output.formula || '(empty)';
      const textLines = doc.splitTextToSize(formulaText, pageWidth - 70);
      const boxHeight = textLines.length * 5 + 6;
      doc.roundedRect(30, y - 2, pageWidth - 60, boxHeight, 2, 2, 'FD');

      doc.setFontSize(10);
      doc.setFont('courier', 'normal');
      doc.setTextColor(60);
      doc.text(textLines, 35, y + 4);
      y += boxHeight + 8;
    });
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  doc.setFontSize(8);
  doc.setTextColor(150);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Mix C - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  doc.save(`${fn.name.replace(/\s+/g, '_')}_formulas.pdf`);
}
