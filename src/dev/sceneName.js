// Reads the ?dev query. Pure, so it runs in Node tests.
// Returns { kind: 'off' | 'list' | 'scene' | 'unknown', name }.
export function parseDevQuery(search, sceneNames) {
  const params = new URLSearchParams(search);
  if (!params.has('dev')) return { kind: 'off', name: '' };
  const name = params.get('dev');
  if (name === '') return { kind: 'list', name };
  if (sceneNames.includes(name)) return { kind: 'scene', name };
  return { kind: 'unknown', name };
}
