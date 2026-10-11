// A small DOM panel of label/value rows. Returns set(label, text).
export function createReadout(parent, labels) {
  const panel = document.createElement('dl');
  panel.className = 'dev-readout';
  const cells = new Map();
  for (const label of labels) {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const value = document.createElement('dd');
    term.textContent = label;
    row.append(term, value);
    panel.append(row);
    cells.set(label, value);
  }
  parent.append(panel);
  return {
    set(label, text) {
      const cell = cells.get(label);
      if (cell && cell.textContent !== text) cell.textContent = text;
    },
  };
}
