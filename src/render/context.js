export const canvas = document.getElementById('c');

export let ctx = canvas.getContext('2d');

export function useContext(next) {
  ctx = next;
}
