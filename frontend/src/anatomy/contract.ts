import type { AnatomyManifest } from '../api';

export const VESSELS = ['LAD', 'LCX', 'RCA'] as const;
export type Vessel = typeof VESSELS[number];
export type GroupName = 'heart' | Vessel;
export const GROUPS: readonly GroupName[] = ['heart', ...VESSELS];
export const LABELS: Record<Vessel, string> = {
  LAD: 'Left anterior descending artery',
  LCX: 'Left circumflex artery',
  RCA: 'Right coronary artery',
};
const EXPECTED = {
  heart: ['FMA7088', 'BP9305', 30], LAD: ['FMA3862', 'BP9548', 18],
  LCX: ['FMA3895', 'BP9745', 6], RCA: ['FMA50039', 'BP9299', 29],
} as const;

// Validate the actual API response, not just its compile-time TypeScript type.
export function validateManifest(input: AnatomyManifest): AnatomyManifest {
  if (!input || input.schema_version !== 1 || !input.groups || !input.meshes || !input.assembly ||
      !input.source_records?.attribution || input.source_records.license !== 'CC BY 4.0') {
    throw new Error('Unsupported or incomplete anatomy manifest');
  }
  if (Object.keys(input.groups).sort().join() !== [...GROUPS].sort().join()) {
    throw new Error('Anatomy must contain exactly heart, LAD, LCX and RCA');
  }
  const seen = new Set<string>();
  for (const group of GROUPS) {
    const record = input.groups[group];
    const [concept, representation, count] = EXPECTED[group];
    if (record.concept_id !== concept || record.representation_id !== representation ||
        !Array.isArray(record.leaf_ids) || record.leaf_ids.length !== count) {
      throw new Error(`Unverified source mapping for ${group}`);
    }
    for (const leaf of record.leaf_ids) {
      if (seen.has(leaf)) throw new Error(`Duplicate coronary/heart geometry: ${leaf}`);
      seen.add(leaf);
      const mesh = input.meshes[leaf];
      if (!/^FJ\d+[A-Z]*$/.test(leaf) || !mesh || mesh.path !== `meshes/${leaf}.obj` ||
          !/^[a-f0-9]{64}$/.test(mesh.sha256) || !Number.isInteger(mesh.bytes) || mesh.bytes <= 0 ||
          !Number.isInteger(mesh.faces) || mesh.faces <= 0 || !Number.isInteger(mesh.vertices) || mesh.vertices <= 0) {
        throw new Error(`Invalid source mesh record: ${leaf}`);
      }
    }
  }
  const original = input.groups.heart.original_leaf_ids;
  if (!original || original.length !== 83 || new Set(original).size !== 83 ||
      original.some(leaf => !seen.has(leaf)) || Object.keys(input.meshes).length !== 83) {
    throw new Error('Heart-base subtraction does not match the original 83-leaf heart');
  }
  const { center, scale } = input.assembly;
  if (!Array.isArray(center) || center.length !== 3 || !center.every(Number.isFinite) ||
      !Number.isFinite(scale) || scale <= 0) throw new Error('Invalid shared anatomical transform');
  return input;
}

// Prediction state carries the same profile/model identity as numerical results.
export type VesselData =
  | { status: 'unavailable' }
  | { status: 'pending' }
  | { status: 'error'; message: string }
  | { status: 'prediction'; probability: number; modelVersion: string; profileFingerprint: string };
export type VesselStates = Record<Vessel, VesselData>;
export const NEUTRAL_STATES: VesselStates = {
  LAD: { status: 'unavailable' }, LCX: { status: 'unavailable' }, RCA: { status: 'unavailable' },
};
export const NEUTRAL_COLOR = '#8a9aa3';

// Continuous display scale: lower model output is cool, the 0.5 threshold is gold and higher
// output is warm. Stops are interpolated in OKLab so nearby probabilities remain distinguishable;
// the v1 single blue-red blend kept lightness constant, making 17-56% nearly identical.
// Display only: probabilities, thresholds and classes are unchanged.
export const PROBABILITY_STOPS: readonly (readonly [number, string])[] = [
  [0, '#2c6db2'], [0.25, '#2e9c9a'], [0.5, '#dcae37'], [0.75, '#df7430'], [1, '#b3202e'],
];
type Lab = [number, number, number];
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSRGB = (c: number) => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
};
function hexToOklab(hex: string): Lab {
  return rgbToOklab([1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]);
}
/** OKLab coordinates of an 8-bit sRGB color; used to verify perceptual spacing of the scale. */
export function rgbToOklab(rgb: [number, number, number]): Lab {
  const [r, g, b] = rgb.map(c => toLinear(c / 255));
  const [l, m, s] = [
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  ].map(Math.cbrt);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function oklabToRGB([L, A, B]: Lab): [number, number, number] {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    toSRGB(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toSRGB(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toSRGB(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}
const LAB_STOPS = PROBABILITY_STOPS.map(([at, hex]) => [at, hexToOklab(hex)] as const);
export function probabilityColor(probability: number): string {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new Error('Probability must be finite and between 0 and 1');
  }
  const upper = Math.max(1, LAB_STOPS.findIndex(([at]) => probability <= at));
  const [a, from] = LAB_STOPS[upper - 1], [b, to] = LAB_STOPS[upper];
  const t = (probability - a) / (b - a);
  const [r, g, bl] = oklabToRGB(from.map((v, i) => v + (to[i] - v) * t) as Lab);
  return `rgb(${r},${g},${bl})`;
}
// CSS gradient sampled from the same function, so the legend cannot drift from the geometry.
export function probabilityGradient(direction = 'to right'): string {
  return `linear-gradient(${direction}, ${Array.from({ length: 21 }, (_, i) => `${probabilityColor(i / 20)} ${i * 5}%`).join(', ')})`;
}
export function vesselColor(data: VesselData): string {
  return data.status === 'prediction' ? probabilityColor(data.probability) : NEUTRAL_COLOR;
}

export function transformPoint(point: readonly number[], manifest: AnatomyManifest): [number, number, number] {
  return [0, 1, 2].map(axis =>
    (point[axis] - manifest.assembly.center[axis]) * manifest.assembly.scale,
  ) as [number, number, number];
}
