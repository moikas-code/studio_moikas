export function saveJobState(state: unknown) {
  localStorage.setItem('videoJobState', JSON.stringify(state));
}
export function loadJobState(): unknown {
  const raw = localStorage.getItem('videoJobState');
  return raw ? JSON.parse(raw) : null;
}
export function clearJobState() {
  localStorage.removeItem('videoJobState');
} 