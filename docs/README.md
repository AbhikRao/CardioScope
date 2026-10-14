# CardioScope documentation

| Document | Contents |
|---|---|
| [REPRODUCIBILITY.md](REPRODUCIBILITY.md) | Exact runtime, Ubuntu Python source build, Docker, CI |
| [MODELING.md](MODELING.md) | Feature contract, split, nested cross-validation, model selection, frozen V1 configurations |
| [FINAL_EVALUATION.md](FINAL_EVALUATION.md) | The once-only 61-record holdout evaluation: all metrics, confusion matrices, uncertainty, limitations |
| [EXPLANATIONS.md](EXPLANATIONS.md) | Linear SHAP and TreeSHAP method, reference set, reconstruction checks |
| [FEATURE_LABELS.md](FEATURE_LABELS.md) | Sources for the readable feature names shown in the interface |
| [INTERFACE.md](INTERFACE.md) | Probability color scale, selection, hypothetical edits, accessibility |
| [anatomy/VERIFICATION.md](anatomy/VERIFICATION.md) | BodyParts3D mapping, coordinate system and browser verification |
| [SOURCE_NOTES.md](SOURCE_NOTES.md) | Dataset and anatomy source observations and minimal corrections |
| [EXPERIMENT_BOUNDARY.md](EXPERIMENT_BOUNDARY.md) | How post-holdout research is kept separate from the frozen product |
| [V2_LCX_RCA.md](V2_LCX_RCA.md), [V21_MULTITASK.md](V21_MULTITASK.md) | Development-only research after the holdout; neither study is deployed ([overview](../research/README.md)) |
| [report/](report/README.md) | Source and build instructions for the six-page report |
| [licenses/](licenses/) | Dependency license inventory and notices |

**Engineering records.** These are the per-phase logs and the machine-readable evidence the verification scripts read:
- [DEVELOPMENT.md](DEVELOPMENT.md), [INTEGRATION.md](INTEGRATION.md), [PRODUCT.md](PRODUCT.md), [HARDENING.md](HARDENING.md)
- `hardening/`, `product/`, `explanations/`, `integration/`

For example, `product/IMMUTABLE_INPUTS.json` is the manifest of the 256 protected files. Keep these paths unchanged.
