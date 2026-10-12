// Display-only readable names for source feature codes. The source code name remains the
// model input, form label and explanation identity. Expansions are restricted to those
// documented in published descriptions of the Z-Alizadeh Sani feature table (see
// docs/FEATURE_LABELS.md). Codes without a documented expansion, and all units, are omitted.
export const FEATURE_LABELS: Readonly<Record<string, string>> = {
  BMI: 'Body mass index',
  DM: 'Diabetes mellitus',
  HTN: 'Hypertension',
  FH: 'Family history',
  CRF: 'Chronic renal failure',
  CVA: 'Cerebrovascular accident',
  CHF: 'Congestive heart failure',
  DLP: 'Dyslipidemia',
  BP: 'Blood pressure',
  PR: 'Pulse rate',
  Nonanginal: 'Nonanginal chest pain',
  'Exertional CP': 'Exertional chest pain',
  'LowTH Ang': 'Low-threshold angina',
  Tinversion: 'T inversion',
  LVH: 'Left ventricular hypertrophy',
  'Poor R Progression': 'Poor R-wave progression',
  BBB: 'Bundle branch block',
  FBS: 'Fasting blood sugar',
  TG: 'Triglyceride',
  LDL: 'Low-density lipoprotein',
  HDL: 'High-density lipoprotein',
  BUN: 'Blood urea nitrogen',
  ESR: 'Erythrocyte sedimentation rate',
  HB: 'Hemoglobin',
  K: 'Potassium',
  Na: 'Sodium',
  WBC: 'White blood cell',
  Lymph: 'Lymphocyte',
  Neut: 'Neutrophil',
  PLT: 'Platelet',
  'EF-TTE': 'Ejection fraction',
  'Region RWMA': 'Region with regional wall motion abnormality',
  VHD: 'Valvular heart disease',
};

/** Readable name when it differs from the source code; otherwise null. */
export function featureLabel(code: string): string | null {
  const label = FEATURE_LABELS[code];
  return label && label.toLowerCase() !== code.toLowerCase() ? label : null;
}

/** Primary display name: the readable name when documented, else the source code. */
export function displayName(code: string): string {
  return featureLabel(code) ?? code;
}
