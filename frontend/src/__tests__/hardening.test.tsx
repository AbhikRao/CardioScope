import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PatientForm } from '../PatientForm';
import { api, validateSchema } from '../api';
import type { FeatureManifest } from '../api';
import { ModuleBoundary } from '../ModuleBoundary';
import source from '../../../artifacts/data/feature_manifest.json';
const schema = source as FeatureManifest;
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it('shows exact group progress and focuses the first invalid field without filling defaults', () => {
  const values = Object.fromEntries(schema.feature_order.map(name => [name, '']));
  render(<PatientForm schema={schema} values={values} onChange={vi.fn()} />);
  Element.prototype.scrollIntoView = vi.fn();
  fireEvent.click(screen.getByRole('button', { name: 'Go to first incomplete or invalid field' }));
  expect(document.activeElement).toBe(screen.getByLabelText('Age'));
  expect(screen.getByLabelText('Age').getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByRole('progressbar').getAttribute('value')).toBe('0');
  expect(screen.getByRole('button', { name: 'Demographics · 0/5' })).toBeTruthy();
  expect((screen.getByLabelText('Age') as HTMLInputElement).value).toBe('');
});
it('keeps group navigation keyboard focus on a field rather than scrolling only', () => {
  render(<PatientForm schema={schema} values={{}} onChange={vi.fn()} />);
  Element.prototype.scrollIntoView = vi.fn();
  fireEvent.click(screen.getByRole('button', { name: 'Laboratory · 0/14' }));
  expect(document.activeElement).toBe(screen.getByLabelText('FBS'));
});
it('rejects malformed schema and target columns before form rendering', () => {
  for (const data of [null, {}, {...source, feature_order: ['Cath', ...source.feature_order.slice(1)]},
    {...source, features: []}]) expect(() => validateSchema(data as FeatureManifest)).toThrow('Malformed source schema');
  expect(validateSchema(schema)).toBe(schema);
});
it('fails cleanly on malformed successful JSON or health data and unavailable backend', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('invalid JSON')).mockResolvedValueOnce(new Response('{}'))
    .mockRejectedValueOnce(new TypeError('Failed to fetch')));
  await expect(api.health()).rejects.toThrow('Malformed API response');
  await expect(api.health()).rejects.toThrow('Malformed application health');
  await expect(api.health()).rejects.toThrow('Failed to fetch');
});
it('contains module errors without claiming anatomy loaded or dropping numerical siblings', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  function Broken() { throw new Error('chunk unavailable'); return null; }
  render(<><p>Numerical outputs remain here</p><ModuleBoundary name="3D anatomy"><Broken /></ModuleBoundary></>);
  expect(screen.getByRole('alert').textContent).toContain('has not loaded successfully');
  expect(screen.getByText('Numerical outputs remain here')).toBeTruthy();
});
it('maps probability to a continuous, distinguishable display scale with the threshold at gold', async () => {
  const { probabilityColor, probabilityGradient, PROBABILITY_STOPS, rgbToOklab } = await import('../anatomy/contract');
  const rgb = (p: number) => probabilityColor(p).match(/\d+/g)!.map(Number);
  const hex = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  // Stops are reproduced exactly (within 8-bit rounding), including 0.5 = gold threshold.
  for (const [at, color] of PROBABILITY_STOPS) rgb(at).forEach((v, i) => expect(Math.abs(v - hex(color)[i])).toBeLessThanOrEqual(1));
  expect(PROBABILITY_STOPS.find(([at]) => at === 0.5)?.[1]).toBe('#dcae37');
  // Continuous: a 0.001 probability step never jumps more than a few 8-bit levels.
  for (let i = 0; i < 1000; i++) {
    const a = rgb(i / 1000), b = rgb((i + 1) / 1000);
    expect(Math.max(...a.map((v, k) => Math.abs(v - b[k])))).toBeLessThanOrEqual(3);
  }
  // Distinguishable: outputs 0.05 apart always differ perceptually (OKLab distance). The v1
  // constant-lightness blue-red blend measured 0.013-0.017 per step; this scale stays above 0.02 everywhere.
  const lab = (p: number) => rgbToOklab(rgb(p) as [number, number, number]);
  for (let i = 0; i <= 95; i++) {
    const a = lab(i / 100), b = lab((i + 5) / 100);
    expect(Math.hypot(...a.map((v, k) => v - b[k]))).toBeGreaterThan(0.02);
  }
  expect(probabilityGradient()).toContain(probabilityColor(0.5));
  for (const bad of [-0.01, 1.01, NaN, Infinity]) expect(() => probabilityColor(bad)).toThrow('Probability');
});
