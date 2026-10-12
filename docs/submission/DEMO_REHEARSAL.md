# Deterministic demo rehearsal

This rehearsal uses only the existing public development example and one labeled hypothetical edit of it. Training, evaluation, threshold changes and scientific changes are not part of rehearsal. The [storyboard](DEMO_SCRIPT.md) targets about 4:30 (narration ≈ 3:00–3:20 at a normal pace), leaving buffer under five minutes; the recorded video must stay within 3–10 minutes.

## Environment and pre-roll

1. Build ahead of time with `make install prepare verify build`.
2. Start with `make run PORT=8000` and open `http://127.0.0.1:8000/`. If port 8000 is already in use, use `PORT=8005`. Never stop an unidentified process.
3. Set the viewport to **1440 × 1000 CSS px**, desktop, 100% zoom, with personal tabs out of frame. The design was checked in Chromium. Use a GPU-backed desktop browser for smooth rotation; a headless software renderer is slower.
4. **Prepared state for 0:00:**
   1. Refresh the page.
   2. Click **Load development example**, then **Run prediction**.
   3. Wait for all four cards and the ✓ badge.
   4. Click **Reset view**.
   5. Scroll so the four cards, the full heart and the legend are in frame.

## Fixed outputs (frozen V1 inference)

The source example ID is `0056fb5ae87a9ac1510fd77cb5cd6bd3b348a0d0de578cf1a86132f8d87733dc`.

| Target | Public example | UI | Hypothetical edit | UI | UI delta |
|---|---:|---|---:|---|---|
| CAD | 0.1709399517600908 | 17.1% Normal | 0.6453028264041153 | 64.5% **CAD** | +47.4 pts |
| LAD | 0.2430538491362383 | 24.3% Normal | 0.5605017044740898 | 56.1% **Stenotic** | +31.7 pts |
| LCX | 0.3705140009054133 | 37.1% Normal | 0.4207450909711793 | 42.1% Normal | +5.0 pts |
| RCA | 0.3090592361868292 | 30.9% Normal | 0.3483626450065975 | 34.8% Normal | +3.9 pts |

**Hypothetical edit, using exact source values only:**
- **Typical Chest Pain:** 0 → **1** (integer field)
- **Atypical:** Y → **N** (category select)

Both fields are in the *Examination and symptoms* group. Use that group button to jump there, then scroll within the form.

After the edit, the form shows the amber note *Hypothetical variation of the public example*, which lists both changes; the edited fields are outlined. **Restore the unedited example** reloads the original values. Results always describe the profile that was last run.

**CAD explanation anchors:**
- Example: Typical Chest Pain −0.9143 (largest factor), Family history +0.7251.
- After the edit: Typical Chest Pain **+0.9143**.

## Reproducible selection checks

1. **Mesh → UI.** In the anterior view, with nothing selected, click the descending **LAD** on the anterior surface (right of center). Confirm all four:
   - LAD glows and the other vessels fade;
   - the LAD card shows *Selected*;
   - the readout says *Selected: LAD — Left anterior descending artery*;
   - the explanation target switches to LAD.
2. **UI → mesh.** Click **Select LCX anatomy** on the card. The camera animates to the posterior view, LCX is highlighted and the explanation switches to LCX. Don't try to click hidden LCX geometry from the front.
3. Use **Isolate selected vessel** → **Show all** → **Reset view**. Reset clears the selection and returns the explanation to CAD.
4. If a click misses or hits another vessel, stop and retake. A button click alone does not prove mesh picking.

## Failure and offline plans

| Failure | Honest recovery |
|---|---|
| Mesh click misses | Rehearse the exposed anterior LAD and retake. |
| WebGL unavailable or context lost | The app shows an explicit failure and the numbers remain. Restart for the working take; a still image is not proof of interaction. |
| SHAP unavailable | Predictions stay visible with an explicit *unavailable* state. Don't invent factors. |
| Backend restart | Restart only the identified server, then reload the example and rerun. Never run an evaluation command. |
| Network unavailable | After install and build, inference, SHAP, meshes and evidence all run locally. |

Before recording, check:
- both output states match the table above;
- the colors visibly change (LAD teal → gold);
- the evidence chart renders;
- the final frame is prepared before the closing line.

Measure the exported duration before uploading.
