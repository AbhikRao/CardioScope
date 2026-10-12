# CardioScope demo storyboard (about 4:30)

- **Format:** English narration over the real frozen V1 app (design update) using only the public development example and one clearly labeled hypothetical edit of it. The official requirement is a 3–10 minute YouTube video.
- **Setup:** follow [DEMO_REHEARSAL.md](DEMO_REHEARSAL.md).
- **On screen throughout:** the disclaimer bar. Let the screen carry caveats, units and fingerprints; the narration below covers only what judges need to hear.

| Time | Narration | On screen |
|---|---|---|
| 0:00–0:15 | "Click an artery on a real heart, and its model output and the reasons behind it follow. This is CardioScope." | **Prepared state:** example predicted, anterior heart, nothing selected. Click the exposed **LAD** on the heart. LAD glows, the others fade, the LAD card shows *Selected* and the readout shows 24.3%. |
| 0:15–0:35 | "CardioScope runs four frozen classifiers, for overall coronary artery disease and stenosis in the LAD, LCX and RCA, on 55 inputs from the public UCI Z-Alizadeh Sani dataset. It's an educational prototype; the disclaimer stays on screen." | Scroll to the top: headline, the five-step guide and the four output cards. |
| 0:35–1:00 | "This is a public development record, not a patient. All 55 fields are explicit, with no hidden defaults or guessed units. Run prediction: FastAPI validates the profile and runs four frozen scikit-learn pipelines. Each card shows a model-estimated probability and the class at the fixed 0.5 threshold. Here, all four are Normal." | Click **Load development example**, then **Run prediction**. Point at the cards (17.1 / 24.3 / 37.1 / 30.9 %) without reading every number. |
| 1:00–1:40 | "These are 83 verified BodyParts3D meshes in one coordinate system. Each whole artery takes its own model's probability on one continuous scale, with gold at the threshold, and the legend shows where each vessel sits. Selection works both ways: click geometry and the card follows; pick a card and the camera finds the artery. This is reference anatomy. It doesn't reconstruct this person's heart or locate a blockage." | Click the **LAD** mesh. Click **Select LCX anatomy**; the camera animates to posterior. **Isolate selected vessel**, then **Show all**, a short drag and zoom, then **Reset view**. |
| 1:40–2:15 | "Why 17 percent? SHAP breaks the CAD output into signed contributions. Family history pushes it up. Typical chest pain, entered as zero, is the largest single factor pushing it down. Every explanation must add back up to the model's actual output; that's the verified badge. This explains the model's behavior, not disease causation." | Scroll to **Explain this model output**, CAD target. Point to the *Largest single contribution* sentence, then the two bar columns, then the ✓ badge. |
| 2:15–3:10 | "Now two hypothetical input changes to the example, not a real patient or a treatment: Typical Chest Pain from 0 to 1, and the Atypical field from Y to N. Re-run the same frozen models. CAD jumps from 17 to 64 percent; LAD crosses the threshold and turns gold. The cards keep the unedited values, and typical chest pain now pushes the output up. Notice LCX and RCA barely move, matching the weakness our evaluation found." | In the form, set **Typical Chest Pain** to `1` and **Atypical** to `N`. The amber *Hypothetical variation* note and highlighted fields appear. Click **Run prediction**. Show the cards (64.5% CAD, 56.1% Stenotic, the deltas), the gold LAD and the moved legend markers. Scroll to the explanation (+0.9143). |
| 3:10–3:50 | "Here's the evidence behind every model. 303 records: 242 for development with nested cross-validation, and 61 held out and evaluated exactly once after freezing. CAD and LAD rank and detect well, with ROC-AUC 0.91 and 0.85. LCX and RCA rank moderately but miss most positives at 0.5. We show that rather than hide it." | Click **Evidence**. Show 303 / 242 / 61, the *Ranking vs. detection* chart (bars and interval whiskers), then the confusion matrices. |
| 3:50–4:15 | "After that test we kept V1 frozen. Two preregistered development-only studies, threshold tuning and a multi-task network, failed their joint gates, so neither ships. React and Three.js in front, FastAPI and scikit-learn behind, every artifact hash-checked in CI." | Scroll to *Post-holdout studies did not change the product*. Optionally show [architecture.svg](assets/architecture.svg) for 5 seconds. |
| 4:15–4:30 | "Four frozen models, one honest test, real anatomy, and explanations that add up exactly. CardioScope." | Click **Prediction**. The hypothetical state is preserved. Scroll to the heart, click **LAD**, and hold the frame with the disclaimer visible. |

**Optional cold open.** In editing, you may place the first 8 seconds of the 2:15 segment (LAD turning gold) before 0:00. Keep the on-screen *Hypothetical variation* label in frame.

**Do not:**
- read decimals, fingerprints or residuals aloud;
- explain log-odds versus probability units (the panel labels them);
- describe the edit as a patient, a treatment effect or a cause;
- demonstrate V2/V2.1 models.

**Rules:** record the actual app, never stills, as proof of interaction. Export with English audio or subtitles and check the final duration. Upload as public or unlisted only after explicit approval.
