export const { PI, sin, cos, min, max, hypot, abs, exp, atan2 } = Math;
export const random = Math.random;

export const clamp = (value, low, high) => max(low, min(high, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (value, target, rate, dt) => value + (target - value) * min(1, dt * rate);
