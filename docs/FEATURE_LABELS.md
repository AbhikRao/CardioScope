# Readable feature names (display only)

The interface shows readable names next to some of the 55 source feature codes. These names only affect what is displayed. The source code name is still the model input, the form field's accessible label, the explanation identity and the key in every API payload. No value, unit, category, SHAP contribution or model input changed.

## Sources

The UCI dataset pages ([411](https://archive.ics.uci.edu/dataset/411/extention+of+z+alizadeh+sani+dataset), [412](https://archive.ics.uci.edu/dataset/412/z+alizadeh+sani)) and their metadata API don't describe individual variables. Expansions therefore come from published descriptions of the same Z-Alizadeh Sani feature table:

- **[S1]** *Coronary Artery Disease Diagnosis; Ranking the Significant Features Using Random Trees Model*, [arXiv:2001.09841](https://arxiv.org/abs/2001.09841), Table 1: "Describe the features used in the Z-Alizadeh-Sani dataset".
- **[S2]** *A Profile-Based Binary Feature Extraction Method Using Frequent Itemsets for Improving Coronary Artery Disease Diagnosis*, [arXiv:2109.10966](https://arxiv.org/abs/2109.10966), feature table. Used only for the RWMA expansion.

Units listed in those papers are **not** shown. The project's source notes say the workbook itself doesn't establish units, and that policy is unchanged.

## Mapping (33 displayed expansions)

| Source code | Displayed name | Evidence |
|---|---|---|
| BMI | Body mass index | S1 |
| DM | Diabetes mellitus | S1 |
| HTN | Hypertension | S1 |
| FH | Family history | S1 |
| CRF | Chronic renal failure | S1 |
| CVA | Cerebrovascular accident | S1 |
| CHF | Congestive heart failure | S1 |
| DLP | Dyslipidemia | S1 (printed as "DPL (Dyslipidemia)") |
| BP | Blood pressure | S1 |
| PR | Pulse rate | S1 |
| Nonanginal | Nonanginal chest pain | S1 |
| Exertional CP | Exertional chest pain | S1 |
| LowTH Ang | Low-threshold angina | S1 |
| Tinversion | T inversion | S1 |
| LVH | Left ventricular hypertrophy | S1 |
| Poor R Progression | Poor R-wave progression | S1 |
| BBB | Bundle branch block | Source categories `LBBB` / `RBBB` / `N` |
| FBS | Fasting blood sugar | S1 |
| TG | Triglyceride | S1 |
| LDL / HDL | Low-density / high-density lipoprotein | S1 |
| BUN | Blood urea nitrogen | S1 |
| ESR | Erythrocyte sedimentation rate | S1 |
| HB | Hemoglobin | S1 |
| K / Na | Potassium / sodium | S1 |
| WBC | White blood cell | S1 |
| Lymph / Neut / PLT | Lymphocyte / neutrophil / platelet | S1 |
| EF-TTE | Ejection fraction | S1 ("EF (Ejection Fraction)"); the `TTE` suffix is left unexpanded |
| Region RWMA | Region with regional wall motion abnormality | S1 ("Region with RWMA"), S2 (RWMA expansion) |
| VHD | Valvular heart disease | S1 |

## Deliberately not expanded

- **Atypical**: neither source expands it, so the code is shown as is.
- **Length**: the source calls it Length. It is not renamed to height.
- **CR**: S1 prints "Creatine". Because that expansion is ambiguous, the code is shown without one.
- **St Elevation**, **St Depression**, **EX-Smoker**: casing-only differences, so no separate name is shown.
- **Function Class**, **Q Wave**, **Edema**, **Dyspnea**, murmurs, smoking fields and other self-describing names: no expansion needed.

The implementation is in [`frontend/src/featureLabels.ts`](../frontend/src/featureLabels.ts). The readable name sits outside the form `<label>`, so each field's accessible name is still exactly its source code.
