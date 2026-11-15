// Scroll-controlled studio lighting over a softly bevelled gold face.
// The type silhouette never changes weight; only the reflected light moves.
export const TEXT_METAL = /* glsl */ `
vec3 liquidMetal(vec2 uv, float progress, float sd, vec2 gradient) {
  float bevel = 1.0 - smoothstep(0.0, 0.24, abs(sd));
  vec2 edge = gradient / max(length(gradient), 0.0001);
  vec3 normal = normalize(vec3(-edge * bevel * 0.65, 1.0));
  float curved = sin(uv.y * 6.0 + uv.x * 3.0 - progress * 3.0) * 0.035;
  float front = mix(-0.20, 1.25, progress);
  float reflection = uv.x + uv.y * 0.10 + curved + normal.x * 0.035;
  float softbox = exp(-pow((reflection - front + 0.05) / 0.12, 2.0));
  float glint = exp(-pow((reflection - front) / 0.018, 2.0));
  float darkWake = exp(-pow((reflection - front + 0.19) / 0.075, 2.0));
  float facingLight = max(dot(normal, normalize(vec3(-0.5, 0.8, 0.9))), 0.0);
  vec3 gold = mix(vec3(0.22, 0.115, 0.022), vec3(0.61, 0.38, 0.10), facingLight);
  gold += bevel * facingLight * vec3(0.20, 0.15, 0.065);
  gold *= 1.0 - darkWake * 0.48;
  return gold + softbox * vec3(0.40, 0.27, 0.115) + glint * vec3(0.55, 0.43, 0.22);
}`;
