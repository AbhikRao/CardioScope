# Devpost-ready project copy

This is prepared copy, not a published submission. Add the video link once it exists, and add both teammates with their real full names and Devpost accounts.

## Project name
CardioScope

## Tagline
Coronary models, made visible.

## Short description
Click an artery on a real 3D heart and see its model output, the factors behind it and the evidence for that model. CardioScope connects 55 structured inputs, four frozen classifiers, BodyParts3D coronary anatomy and verified SHAP in one connected workflow.

## Inspiration
Coronary risk models usually produce a row of numbers. We wanted a judge, student or clinician-in-training to be able to point at the LAD and ask three questions in one place: what did the model say, why, and how much should I trust it.

## Problem
Clinical tables lack spatial context; polished probability displays can conceal weak evidence. Track A brings prediction, anatomy and explanation together. We make their evidence and limits visible.

## What it does
A user loads the public development example, or supplies a complete 55-feature source profile, and runs four frozen classifiers (CAD, LAD, LCX, RCA). Then:

- **Click an artery on the heart.** Its card and the explanation panel switch to that vessel. The artery glows in its own probability color and the others fade.
- **Read the color.** One continuous scale (blue → teal → gold at the 0.5 threshold → red) colors the geometry, the cards and a legend that marks where each vessel sits.
- **Ask why.** Signed SHAP factors show each entered value with a readable name (FH → Family history, ESR → Erythrocyte sedimentation rate), the largest single contribution in plain words, and a "reconstruction verified" badge.
- **Try a labeled what-if.** Change `Typical Chest Pain` 0→1 and `Atypical` Y→N on the public example and rerun. CAD moves 17.1% → 64.5% and LAD 24.3% → 56.1%; both classes flip, LAD turns gold on the heart, and the cards show the unedited values for comparison. LCX/RCA barely move, which is consistent with their weak holdout sensitivity.
- **Check the evidence.** A saved-evidence dashboard shows ROC-AUC and recall with 95% intervals, confusion matrices and limitations.

These outputs do not form a joint probability distribution. Reference anatomy is not a patient reconstruction or lesion map. The visible educational disclaimer stays part of the experience.

## How we built it
React, TypeScript and Vite serve the interface. React Three Fiber, Drei and Three.js render verified OBJ leaves, with mesh picking, animated camera presets and a probability scale interpolated in OKLab. FastAPI validates profiles and orchestrates frozen scikit-learn inference and SHAP. Model, schema and profile fingerprints chain every prediction to its explanation, so stale or mismatched responses are rejected. Explicit failure states keep verified numbers visible when rendering or explanations are unavailable. Bundled artifacts, pinned Python/npm environments, integrity checks and Docker support reproducibility without paid runtime APIs.

**What we built ourselves:**
- The verified 83-leaf coronary mapping, with coronaries subtracted from the heart base.
- Schema-exact input validation.
- Fingerprint-chained inference and explanations.
- One-hot SHAP aggregation back to the 55 source features.
- A float32 tree-routing adapter that keeps TreeSHAP exact for the saved forests.
- A guard that permits only one holdout evaluation.
- A 256-file integrity manifest checked in CI.

## ML methodology
UCI's Extension of Z-Alizadeh Sani contains 303 records. We allow 55 predictors and exclude Cath/LAD/LCX/RCA from inputs. A locked shared split reserves 61 records, with 242 for development. Each target has its own locked five-outer/three-inner nested folds; preprocessing and selection stay inside training folds. CAD/LAD use balanced L2 logistic regression; LCX/RCA use shallow unweighted forests. All four models were frozen before the final holdout was evaluated once.

On that small same-source holdout, CAD ROC-AUC/recall were **0.9134/0.9070**, and LAD **0.8474/0.8485**. LCX and RCA ranking was moderate, with ROC-AUC **0.6723/0.6976**, but recall was weak: **0.2083/0.2857**. This is not external clinical validation or established calibrated risk.

## 3D visualization
The heart plus LAD/LCX/RCA use 83 verified BodyParts3D leaves in one shared coordinate system. Coronary leaves are removed from the heart base, preventing duplicate groups. Continuous whole-vessel coloring follows named model probabilities; selection has a separate highlight. We preserve source geometry and do not animate narrowing or invent blockage positions.

## Explainability
Linear SHAP explains CAD/LAD in positive-class log-odds; TreeSHAP explains LCX/RCA in probability contribution space. The background is a deterministic 100-record development-only reference. Encoded categories aggregate back to all 55 source features, and every accepted explanation is checked against the unrounded model output. Source abbreviations get readable names only where published descriptions of the feature table document them; ambiguous codes and all units are left as they are. SHAP associations do not establish causality, mechanism or treatment.

## Challenges
The hardest scientific boundary was preserving an honest final test while making a usable, interpretable product. Engineering challenges included verifying artery mappings, preserving shared coordinates, reconciling tree-routing precision for SHAP, and reproducing the exact frozen environment on Linux. Limited data and weak LCX/RCA detection remained visible rather than being hidden behind the visualization.

## Accomplishments
We completed a connected workflow: an artery click drives the card, color, label and explanation, and an input edit drives all four outputs, the heart and the SHAP factors. **Hosted GitHub Actions passed** for the published `main` and `v1.0.0` commits: 134 Python tests, 75 frontend tests, the frozen-model/SHAP smoke test, and all 256 protected files byte-identical. The same suites passed on macOS ARM64 and clean Ubuntu ARM64, and desktop Chromium, Firefox and Safari workflows were checked. Lazy loading cut initial JavaScript by about 78%.

## What we learned
After the once-only test exposed weak vessel sensitivity, we treated the holdout as consumed and froze V1. Two bounded, separately preregistered development-only experiments tested threshold/model changes and a small multi-task neural network. Thresholding recovered sensitivity but lacked the required stability; RCA's mean scores were higher on paired development folds in the multi-task study, while LCX and CAD-preservation conditions failed. Neither joint gate passed. Neither study is independently validated or deployed, and no final neural candidate was fitted.

## Limitations
Only 303 source records, a 61-record same-source holdout, no independent external cohort or verified true patient IDs, uncalibrated probabilities and poor LCX/RCA recall at 0.5. Reference anatomy cannot locate lesions or estimate narrowing geometry. The system is an educational/research prototype without clinical deployment validation.

## Future work
A new, independently collected cohort would be needed to validate a future model. Larger representative data, verified patient grouping, prospective calibration assessment, and domain-expert review could guide later work. Patient-specific anatomy would require an appropriate imaging dataset and a separate validated pipeline. These capabilities require separate validation.

## Built with
Python; scikit-learn; NumPy; pandas; SHAP; FastAPI; uvicorn; React; TypeScript; Vite; Three.js; React Three Fiber; Drei; Vitest; pytest; Docker; GitHub Actions. Data: UCI Extension of Z-Alizadeh Sani. Anatomy: BodyParts3D. XGBoost and PyTorch appear only in isolated research, not the V1 product runtime.

## Submission links and gallery

- Public GitHub repository: [AbhikRao/CardioScope](https://github.com/AbhikRao/CardioScope). Code and `v1.0.0` are published and hosted CI passed. If the design update is merged, verify its own CI run before linking it as current.
- YouTube demo: **pending recording**; 3-10 minutes, English audio/subtitles, public or unlisted.
- Report: `output/pdf/CardioScope-Track-A-Report.pdf` (six pages).
- Gallery order (real production-build captures in `docs/submission/assets/v2/`): `report-stage-LAD-selected.png`, `report-canvas-example.png` + `report-canvas-hypothetical.png` (label the second "hypothetical edit"), `explanation-CAD-example.png`, `evidence-glance.png`, `overview.png`.

Dataset: [UCI, CC BY 4.0](https://archive.ics.uci.edu/dataset/411/extention+of+z+alizadeh+sani+dataset), DOI [10.24432/C5461K](https://doi.org/10.24432/C5461K). BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International, from the [current archive](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). Project code is MIT-licensed; third-party licenses are retained.
