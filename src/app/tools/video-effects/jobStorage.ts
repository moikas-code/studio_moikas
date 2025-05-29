export function saveJobState(state: any) {
  localStorage.setItem('videoJobState', JSON.stringify(state));
}
export function loadJobState() {
  const raw = localStorage.getItem('videoJobState');
  return raw ? JSON.parse(raw) : null;
}
export function clearJobState() {
  localStorage.removeItem('videoJobState');
} 