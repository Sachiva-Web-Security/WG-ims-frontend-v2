// All supported measurement units — Metric + USA
export const UNITS = [
  { value: 'tsp', label: 'tsp — Teaspoon', system: 'US Volume' },
  { value: 'tbsp', label: 'tbsp — Tablespoon', system: 'US Volume' },
  { value: 'fl oz', label: 'fl oz — Fluid Ounce', system: 'US Volume' },
  { value: 'cup', label: 'cup — Cup', system: 'US Volume' },
  { value: 'pt', label: 'pt — Pint', system: 'US Volume' },
  { value: 'qt', label: 'qt — Quart', system: 'US Volume' },
  { value: 'gal', label: 'gal — Gallon', system: 'US Volume' },
  { value: 'oz', label: 'oz — Ounce', system: 'US Weight' },
  { value: 'lb', label: 'lb — Pound', system: 'US Weight' },
  { value: 'ml', label: 'ml — Milliliter', system: 'Metric Volume' },
  { value: 'liters', label: 'L — Liter', system: 'Metric Volume' },
  { value: 'g', label: 'g — Gram', system: 'Metric Weight' },
  { value: 'kg', label: 'kg — Kilogram', system: 'Metric Weight' },
  { value: 'each', label: 'each — Each / Piece', system: 'Count' },
  { value: 'pcs', label: 'pcs — Pieces', system: 'Count' },
  { value: 'dozen', label: 'dozen — Dozen (12)', system: 'Count' },
  { value: 'case', label: 'case — Case', system: 'Count' },
  { value: 'box', label: 'box — Box', system: 'Count' },
  { value: 'bag', label: 'bag — Bag', system: 'Count' },
  { value: 'pack', label: 'pack — Pack', system: 'Count' },
  { value: 'portions', label: 'portions — Portions', system: 'Count' },
  { value: 'slices', label: 'slices — Slices', system: 'Count' },
];

export const UNIT_GROUPS = UNITS.reduce((acc, u) => {
  if (!acc[u.system]) acc[u.system] = [];
  acc[u.system].push(u);
  return acc;
}, {});

export function UnitSelect({ value, onChange, className = 'input' }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={className}>
      {Object.entries(UNIT_GROUPS).map(([group, units]) => (
        <optgroup key={group} label={group}>
          {units.map(u => (
            <option key={u.value} value={u.value}>{u.value} — {u.label.split(' — ')[1]}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
