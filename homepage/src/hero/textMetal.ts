// Scroll-controlled studio lighting over a softly bevelled liquid-silver face.
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
  vec3 steel = mix(vec3(0.075, 0.09, 0.12), vec3(0.28, 0.32, 0.38), facingLight);
  steel += bevel * facingLight * 0.15;
  steel *= 1.0 - darkWake * 0.48;
  return steel + softbox * vec3(0.40, 0.46, 0.52) + glint * vec3(0.42, 0.45, 0.49);
}`;
