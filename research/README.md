# Post-holdout research (development only, not deployed)

This folder holds two studies run **after** the frozen V1 models had been evaluated once on the 61-record holdout. They are not part of the CardioScope product. The application never imports them.

| Study | What it tested | Outcome |
|---|---|---|
| [`v2_lcx_rca/`](v2_lcx_rca/) | Threshold selection, elastic net, forest/cost-sensitive variants and XGBoost for LCX/RCA | Failed its preregistered joint stability gate. Not deployed. [Report](../docs/V2_LCX_RCA.md) |
| [`v21_multitask/`](v21_multitask/) | A small four-task neural network | RCA passed its internal vessel gate; LCX and CAD preservation failed, so no final candidate was fitted. [Report](../docs/V21_MULTITASK.md) |

- **Data:** both studies were preregistered (`protocol.json` + `protocol.sha256`) and used repeated nested cross-validation on the original 242 development records only.
- **Results:** saved under [`artifacts/experiments/`](../artifacts/experiments/). They are internal development estimates, not test results or independent validation.
- **Environments:** each study pins its own locked environment (`requirements.lock.txt`), separate from the product runtime.
