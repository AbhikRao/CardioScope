# Interface notes

These notes cover how the interface presents frozen V1 outputs. Nothing here changes a probability, threshold, class, SHAP value, anatomical mapping or mesh.

## Probability color scale

`probabilityColor` ([`frontend/src/anatomy/contract.ts`](../frontend/src/anatomy/contract.ts)) maps a model-estimated probability to a continuous color. It interpolates five fixed stops in OKLab:

| Probability | Stop |
|---|---|
| 0 | blue `#2c6db2` |
| 0.25 | teal `#2e9c9a` |
| **0.5 (threshold)** | **gold `#dcae37`** |
| 0.75 | orange `#df7430` |
| 1 | red `#b3202e` |

An earlier blend from blue to red kept lightness constant, which made outputs between about 17% and 56% look almost identical. On the new scale, every 0.05 step differs by more than 0.02 in OKLab distance, and a test enforces this. The geometry, the output cards and the legend all use the same function, and legend markers show where each vessel sits. Color encodes whole-vessel model probability. It does not encode measured stenosis severity, percent narrowing or lesion location.

## Selection and anatomy

- **Two-way selection.** Clicking an artery on the heart selects its output card and switches the explanation target. Selecting a card highlights the artery.
- **Highlighting.** The selected vessel glows in its own probability color and the other vessels fade, so a selection never changes a vessel's hue.
- **Camera.** Preset changes animate the camera only. They are skipped when the browser requests reduced motion and stop as soon as the user drags.
- **Geometry.** The anatomy is the verified BodyParts3D reference set: 83 leaves in one coordinate system. See [anatomy verification](anatomy/VERIFICATION.md).

## Hypothetical edits

After the public development example is loaded, any edited field is outlined. A note lists every change and states that the result is not a real patient, a clinical intervention or a validated causal effect. When the edited profile is predicted, each card also shows the unedited example's frozen output for comparison.

The demonstration edit sets `Typical Chest Pain` 0 → 1 and `Atypical` Y → N:

| Target | Unedited example | Hypothetical edit |
|---|---|---|
| CAD | 17.1% (Normal) | 64.5% (CAD) |
| LAD | 24.3% (Normal) | 56.1% (Stenotic) |
| LCX | 37.1% (Normal) | 42.1% (Normal) |
| RCA | 30.9% (Normal) | 34.8% (Normal) |

The example itself is selected without looking at outcomes: it is the development record with the smallest content ID.

## Explanations

- **Readable names.** Source abbreviations show readable names only where published descriptions of the feature table define them; see [FEATURE_LABELS.md](FEATURE_LABELS.md). Each source code stays visible, and no units are added.
- **Panel contents.** The panel shows the target's probability and class, the contribution units, a reconstruction-verified badge and the largest single contribution. Baseline, residual and identity fingerprints sit in collapsible sections. See [EXPLANATIONS.md](EXPLANATIONS.md) for the method.

## Accessibility

Text colors introduced by the interface meet WCAG AA contrast (at least 4.5:1). Disabled controls are exempt.
