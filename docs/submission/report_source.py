"""Editable six-page Track A report. Rendering only; no inference/training imports.

Run with a document environment containing reportlab and Pillow:
    python docs/submission/report_source.py
Numbers come from CLAIMS.json, copied from saved aggregate V1 evidence.
"""
from pathlib import Path
import hashlib
import json
from xml.sax.saxutils import escape
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / 'docs/submission'
CLAIMS = json.loads((DIR / 'CLAIMS.json').read_text())
SOURCE = ROOT / CLAIMS['v1']['source']
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == CLAIMS['v1']['source_sha256']
# Validate real capture provenance and exact integer crops; never alter screenshot content.
PROVENANCE = json.loads((DIR / 'SCREENSHOT_PROVENANCE.json').read_text())
for record in PROVENANCE['screenshots']:
    assert hashlib.sha256((ROOT / record['path']).read_bytes()).hexdigest() == record['sha256']
for record in PROVENANCE.get('derived_crops', []):
    source = ROOT / record['source_path']
    output = ROOT / record['path']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == record['source_sha256']
    assert hashlib.sha256(output.read_bytes()).hexdigest() == record['sha256']
    with Image.open(source) as original, Image.open(output) as crop:
        expected = original.crop(record['crop_box_ltrb'])
        assert crop.size == expected.size and crop.mode == expected.mode
        assert crop.tobytes() == expected.tobytes()
# Design-update captures (real production-build screenshots) are hash-checked the same way.
V2 = json.loads((DIR / 'assets/v2/provenance.json').read_text())
V2_HASHES = {r['path']: r['sha256'] for r in V2['records']}
OUT = ROOT / 'output/pdf/CardioScope-Track-A-Report.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
W, H = A4
M = 36
CW = W - 2 * M
INK = colors.HexColor('#102C39')
TEAL = colors.HexColor('#007F83')
MUTED = colors.HexColor('#526570')
LIGHT = colors.HexColor('#EDF5F5')
AMBER = colors.HexColor('#996000')
C = canvas.Canvas(str(OUT), pagesize=A4, invariant=1)
C.setTitle('CardioScope | Track A final report')
C.setAuthor('CardioScope team')
C.setSubject('Frozen V1, once-only same-source holdout; research and educational prototype')
C.setCreator('CardioScope editable report source')


def para(text, y, x=M, width=CW, size=10, color=INK, max_height=None):
    p = Paragraph(text, ParagraphStyle('body', fontName='Helvetica', fontSize=size,
                  leading=size*1.42, textColor=color, spaceAfter=0))
    _, height = p.wrap(width, H)
    if max_height is not None:
        assert height <= max_height, (text[:60], height, max_height)
    assert y - height >= 50, (text[:60], y, height)
    p.drawOn(C, x, y-height)
    return y-height


def title(page, eyebrow, headline, subtitle):
    C.setFillColor(TEAL)
    C.rect(0, H-11, W, 11, fill=1, stroke=0)
    C.setFont('Helvetica-Bold', 9)
    C.drawString(M, H-38, 'CARDIOSCOPE  /  TRACK A')
    C.setFillColor(MUTED)
    C.setFont('Helvetica', 8)
    C.drawRightString(W-M, H-38, eyebrow.upper())
    C.setFillColor(INK)
    C.setFont('Helvetica-Bold', 25)
    C.drawString(M, H-77, headline)
    para(subtitle, H-95, size=10.3, max_height=44)
    C.setStrokeColor(colors.HexColor('#D5E3E7'))
    C.line(M, 43, W-M, 43)
    C.setFont('Helvetica', 7.5)
    C.setFillColor(MUTED)
    C.drawString(M, 28, 'Frozen V1 models  |  Research / educational prototype  |  github.com/AbhikRao/CardioScope')
    C.drawRightString(W-M, 28, f'{page} / 6')


def heading(text, y):
    C.setFillColor(TEAL)
    C.setFont('Helvetica-Bold', 12)
    C.drawString(M, y-12, text)
    return y-24


def image(name, y, height=None):
    reader = ImageReader(str(DIR / 'assets' / name))
    iw, ih = reader.getSize()
    height = height or CW*ih/iw
    width = height*iw/ih
    assert width <= CW+0.01
    x = M+(CW-width)/2
    C.setStrokeColor(colors.HexColor('#D5E3E7'))
    C.roundRect(x-1, y-height-1, width+2, height+2, 3, fill=0, stroke=1)
    C.drawImage(reader, x, y-height, width, height, mask='auto')
    return y-height


def v2image(name, x, y, width=None, height=None):
    path = f'docs/submission/assets/v2/{name}.png'
    assert hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == V2_HASHES[path], path
    reader = ImageReader(str(ROOT / path))
    iw, ih = reader.getSize()
    if width is None:
        width = height*iw/ih
    height = width*ih/iw
    assert x + width <= W - M + 0.01 and y - height >= 50, (name, y, height)
    C.setStrokeColor(colors.HexColor('#D5E3E7'))
    C.roundRect(x-1, y-height-1, width+2, height+2, 3, fill=0, stroke=1)
    C.drawImage(reader, x, y-height, width, height, mask='auto')
    return y-height


def metric_tiles(y):
    gap = 8
    bw = (CW-3*gap)/4
    for i, target in enumerate(['CAD', 'LAD', 'LCX', 'RCA']):
        m = CLAIMS['v1']['metrics'][target]
        weak = target in ('LCX', 'RCA')
        x = M+i*(bw+gap)
        C.setFillColor(colors.HexColor('#FFF4E1') if weak else LIGHT)
        C.roundRect(x, y-62, bw, 62, 5, fill=1, stroke=0)
        C.setFillColor(INK); C.setFont('Helvetica-Bold', 9); C.drawString(x+9, y-14, target)
        C.setFillColor(AMBER if weak else TEAL); C.setFont('Helvetica-Bold', 19)
        C.drawString(x+9, y-36, f"{m['roc_auc']:.3f}")
        C.setFont('Helvetica', 7.2); C.setFillColor(MUTED)
        C.drawString(x+9, y-47, 'holdout ROC-AUC')
        C.drawString(x+9, y-56, f"recall at 0.5: {m['recall']:.3f}" + ('  (weak)' if weak else ''))
    return y-62


def callout(text, y, height=60, warning=False):
    assert y-height >= 52, ('callout bottom', y-height)
    C.setFillColor(colors.HexColor('#FFF4E1') if warning else LIGHT)
    C.roundRect(M, y-height, CW, height, 7, fill=1, stroke=0)
    para(text, y-11, x=M+12, width=CW-24, size=10,
         color=AMBER if warning else INK, max_height=height-20)
    return y-height


def flow(labels, y, width=CW, x=M):
    gap=12
    bw=(width-gap*(len(labels)-1))/len(labels)
    for i, label in enumerate(labels):
        bx=x+i*(bw+gap)
        C.setFillColor(LIGHT)
        C.roundRect(bx, y-43, bw, 43, 5, fill=1, stroke=0)
        para(label, y-8, x=bx+7, width=bw-14, size=8.2, max_height=29)
        if i < len(labels)-1:
            C.setStrokeColor(TEAL)
            C.line(bx+bw+2, y-21, bx+bw+gap-2, y-21)
            C.line(bx+bw+gap-2, y-21, bx+bw+gap-5, y-18)
            C.line(bx+bw+gap-2, y-21, bx+bw+gap-5, y-24)
    return y-43


# PAGE 1: solution
title(1, 'Problem + solution', 'Coronary model outputs on real anatomy',
      'CardioScope connects 55 structured clinical inputs to four frozen classifiers, an interactive BodyParts3D heart, verified SHAP explanations and transparent saved evidence.')
y=H-148
y=para('A probability table is hard to read spatially. In CardioScope a user clicks an artery on the heart; its card, color and explanation follow, and every number links back to the once-only holdout evidence.', y, size=10.5)
y=metric_tiles(y-10)
y=para('Prespecified 61-record same-source holdout, evaluated once after freezing. CAD/LAD are strong; LCX/RCA rank moderately but miss most positives at the fixed 0.5 threshold.', y-6, size=8.3, color=MUTED)
y=v2image('report-stage-LAD-selected', M, y-10, width=CW)
y=para('<b>Real production-build capture.</b> Public development example; LAD selected by click, so the other vessels fade. Each whole artery is colored by its own model-estimated probability (gold = 0.5). Reference anatomy, not this person\'s heart.', y-7, size=8.3, color=MUTED)
callout('<b>Educational / research decision-support prototype.</b> Not a diagnostic replacement or validated clinical risk. Source: <link href="https://github.com/AbhikRao/CardioScope" color="#007F83">github.com/AbhikRao/CardioScope</link>', y-10, height=50)
C.showPage()

# PAGE 2: method
title(2, 'Data + methodology', 'A frozen, auditable evaluation',
      'A shared prespecified split separates development decisions from the once-only final test. Preprocessing and selection stay inside development folds.')
y=H-158
for i,(big,small) in enumerate([('303','source records'),('55','allowed predictors'),('242','development'),('61','final holdout')]):
    x=M+i*(CW/4)
    C.setFillColor(LIGHT); C.roundRect(x, y-72, CW/4-8,72,5,fill=1,stroke=0)
    C.setFillColor(TEAL); C.setFont('Helvetica-Bold',26); C.drawString(x+12,y-33,big)
    para(small,y-43,x=x+12,width=CW/4-23,size=8.5)
y-=92
y=heading('UCI Extension of Z-Alizadeh Sani',y)
y=para('The published table has 59 columns: 55 predictors and four targets. <b>Cath (CAD), LAD, LCX and RCA are excluded from all model inputs.</b> CAD and Stenotic are the positive classes. Input validation preserves the existing source schema and category contract; no hidden default clinical profile or missing-value imputation is supplied.',y)
y=flow(['<b>242 only</b><br/>development', '<b>5 outer / 3 inner</b><br/>locked folds', '<b>Select + freeze</b><br/>four pipelines', '<b>61 once</b><br/>final test'],y-18)
y=heading('Leakage controls and selection', y-21)
y=para('The 242/61 development-holdout split is shared across targets; each target uses its own locked nested-CV folds. Duplicate predictor groups stay together; true patient IDs are unavailable. Scaling and categorical vocabularies fit each training fold. Outer validation reports the nested selection procedure; it does not select configurations.', y)
y=para('The final development-only selection rule uses the mean of the locked inner ROC-AUC scores, then Brier score and predeclared simplicity tie-breaks. Frozen pipelines are fitted on all 242 development records before the 61-record final evaluation. The threshold remains <b>0.5 for every target</b>; probabilities are uncalibrated.', y-11)
y=heading('V1 configurations used in the application',y-20)
configs=[('CAD + LAD','Balanced logistic regression, C = 0.1, L2; fold-fitted scaling.'),('LCX','Random forest: 100 trees, depth 3, minimum leaf 10, unweighted.'),('RCA','Random forest: 100 trees, depth 5, minimum leaf 10, unweighted.')]
for label,text in configs:
    y=para(f'<b>{label}</b>  {text}',y,size=10)-11
y=para('Forests use sqrt feature sampling and bootstrap; random state 42. Encoded categorical predictors use training-fitted one-hot encoding with unknown categories ignored. Model/schema/split/search/membership fingerprints and saved receipts connect the frozen artifacts.',y,size=8.7,color=MUTED)
callout('<b>Scope of independence:</b> the final test is a prespecified, same-source holdout. It is not an external cohort or clinical deployment validation.',y-16,height=54,warning=True)
C.showPage()

# PAGE 3: performance
title(3,'Predictive performance','The final V1 results, including limits',
      'Primary evidence: the once-only 61-record holdout, with models and threshold frozen beforehand. Every target is shown; higher AUC does not guarantee useful sensitivity.')
y=H-145
# native vector comparison, common scale
C.setFont('Helvetica-Bold',9); C.setFillColor(TEAL); C.drawString(M,y,'ROC-AUC'); C.setFillColor(AMBER); C.drawString(M+90,y,'Recall at 0.5')
y-=22
for target in ['CAD','LAD','LCX','RCA']:
    m=CLAIMS['v1']['metrics'][target]
    C.setFillColor(INK); C.setFont('Helvetica-Bold',10); C.drawString(M,y-11,target)
    bx=M+54; bw=CW-104
    for k,offset,color in [('roc_auc',0,TEAL),('recall',15,AMBER)]:
        C.setFillColor(LIGHT); C.rect(bx,y-offset-12,bw,9,fill=1,stroke=0)
        C.setFillColor(color); C.rect(bx,y-offset-12,bw*m[k],9,fill=1,stroke=0)
        C.setFont('Helvetica',9); C.drawRightString(W-M,y-offset-12,f'{m[k]:.3f}')
    y-=32
y=para('Bars use a common 0-1 scale. Recall is sensitivity for CAD / Stenotic.',y-3,size=8,color=MUTED)
y=heading('All saved point estimates', y-16)
rows=[('Accuracy','accuracy'),('Balanced accuracy','balanced_accuracy'),('Precision','precision'),('Recall / sensitivity','recall'),('F1','f1'),('ROC-AUC','roc_auc'),('PR-AUC (trapezoidal)','pr_auc'),('Average precision','average_precision'),('Brier (lower better)','brier_score')]
first=M+185; col=(CW-185)/4
C.setFillColor(INK); C.setFont('Helvetica-Bold',9)
for i,t in enumerate(['CAD','LAD','LCX','RCA']): C.drawCentredString(first+col*(i+.5),y-10,t)
y-=22
for j,(label,k) in enumerate(rows):
    if j%2==0:
        C.setFillColor(LIGHT); C.rect(M,y-20,CW,22,fill=1,stroke=0)
    C.setFillColor(INK); C.setFont('Helvetica',9); C.drawString(M+7,y-12,label)
    for i,t in enumerate(['CAD','LAD','LCX','RCA']):
        C.drawCentredString(first+col*(i+.5),y-12,f"{CLAIMS['v1']['metrics'][t][k]:.4f}")
    y-=22
y=heading('Confusion matrices',y-14)
for i,t in enumerate(['CAD','LAD','LCX','RCA']):
    a=CLAIMS['v1']['metrics'][t]['confusion_matrix']; x=M+i*CW/4
    para(f'<b>{t}</b><br/>TN {a[0][0]} &nbsp; FP {a[0][1]}<br/>FN {a[1][0]} &nbsp; TP {a[1][1]}',y,x=x+4,width=CW/4-8,size=8.5,max_height=37)
y-=39
y=para('TN/FP: true negative / false positive; FN/TP: false negative / true positive. Positive counts: CAD 43, LAD 33, LCX 24, RCA 21. PR-AUC and AP are distinct summaries, not interchangeable.',y,size=8.3,color=MUTED)
y=callout('<b>LCX and RCA are a material weakness.</b> Moderate ranking ability did not translate to strong sensitivity at 0.5: 19/24 LCX positives and 15/21 RCA positives were missed. This is not a validated screening tool.',y-14,height=58,warning=True)
para('Small-test uncertainty matters: saved 95% ROC-AUC intervals are CAD 0.819-0.978, LAD 0.745-0.929, LCX 0.537-0.802 and RCA 0.563-0.820 (stratified percentile bootstrap, no refitting). These intervals condition on empirical class counts; independence and external generalization are unverified.',y-10,size=8.4,color=MUTED)
C.showPage()

# PAGE 4: anatomy
title(4,'3D + integration','One click, one connected system',
      'BodyParts3D geometry is wired to frozen inference: card and mesh share one selection, colors follow live outputs, and explanations follow the selected artery.')
y=H-150
half=(CW-12)/2
C.setFillColor(INK); C.setFont('Helvetica-Bold', 9)
C.drawString(M, y, 'Public development example'); C.drawString(M+half+12, y, 'Hypothetical edit: Typical Chest Pain 0 -> 1, Atypical Y -> N')
v2image('report-canvas-example', M, y-6, width=half)
y=v2image('report-canvas-hypothetical', M+half+12, y-6, width=half)
cards={r['path'].split('/')[-1]: r['outputs'] for r in V2['records'] if 'report-cards' in r['path']}
assert cards['report-cards-example.png'] == {'CAD':'17.1% Normal','LAD':'24.3% Normal','LCX':'37.1% Normal','RCA':'30.9% Normal'}
assert cards['report-cards-hypothetical.png'] == {'CAD':'64.5% CAD','LAD':'56.1% Stenotic','LCX':'42.1% Normal','RCA':'34.8% Normal'}
rows=[('Target','Unedited example','Hypothetical edit','Change'),('CAD','17.1%  Normal','64.5%  CAD','+47.4 pts'),('LAD','24.3%  Normal','56.1%  Stenotic','+31.7 pts'),('LCX','37.1%  Normal','42.1%  Normal','+5.0 pts'),('RCA','30.9%  Normal','34.8%  Normal','+3.9 pts')]
y-=12
cols=[M, M+90, M+230, M+380]
for j,row in enumerate(rows):
    if j%2==0:
        C.setFillColor(LIGHT); C.rect(M, y-15, CW, 16, fill=1, stroke=0)
    C.setFillColor(INK); C.setFont('Helvetica-Bold' if j==0 else 'Helvetica', 8.6)
    for x,cell in zip(cols,row): C.drawString(x+6, y-11, cell)
    y-=16
top=y-8
v2image('report-cards-example', M, top, width=half)
y=v2image('report-cards-hypothetical', M+half+12, top, width=half)
y=para('Real output cards from the running application (same states as above): class pills flip for CAD and LAD; the hypothetical card keeps the unedited value for comparison. The edit is labeled in the UI and is not a real patient, intervention or causal effect. LCX/RCA barely respond, consistent with their weak holdout sensitivity.', y-6, size=8.3, color=MUTED)
y=heading('83 verified mesh leaves, one coordinate system', y-12)
y=para('<b>Heart base 30 / LAD 18 / LCX 6 / RCA 29</b>, one shared source coordinate system and assembly transform; coronary leaves are excluded from the heart base. Selection works both ways (mesh to card, card to mesh) and also switches the explanation target. Presets animate the camera only; isolate, orbit and zoom support inspection.', y, size=9.3)
y=para('A continuous OKLab scale (blue, teal, gold at 0.5, orange, red) maps each whole vessel\'s probability; nearby outputs stay distinguishable, unlike the earlier constant-lightness blend. Loading, missing-mesh and WebGL failures are explicit; numbers remain available.', y-8, size=9.3)
callout('<b>Reference anatomy only.</b> No patient reconstruction, lesion localization, vessel-diameter estimate or narrowing percentage is inferred. Source: BodyParts3D, © The Database Center for Life Science, CC Attribution 4.0 International.', y-12, height=64, warning=True)
C.showPage()

# PAGE 5: explanation
title(5,'Explainability','Why the model produced this output',
      'Signed SHAP factors link each entered value to the selected target. Every explanation is checked against the actual frozen output before it is shown.')
y=H-148
y=v2image('report-factors-CAD-example', M, y, width=CW)
y=para('<b>Real capture, public example, CAD 17.1%:</b> the five largest factors in each direction, in model log-odds. Readable names expand documented source abbreviations (code shown beneath); entered values are unchanged. Typical Chest Pain (entered 0) is the largest single factor; after the hypothetical edit on page 4 it becomes +0.914.', y-7, size=8.4, color=MUTED)
glossary=[('FH','Family history'),('DLP','Dyslipidemia'),('HTN','Hypertension'),('DM','Diabetes mellitus'),('CRF','Chronic renal failure'),('CVA','Cerebrovascular accident'),('ESR','Erythrocyte sedimentation rate'),('BUN','Blood urea nitrogen'),('EF-TTE','Ejection fraction'),('Region RWMA','Region with regional wall motion abnormality'),('LowTH Ang','Low-threshold angina'),('VHD','Valvular heart disease')]
y=heading('Readable names for source codes (display only)',y-12)
colw=CW/2
for i,(code,name) in enumerate(glossary):
    x=M+(i%2)*colw; row=i//2
    if (i%2)==0 and row%2==0:
        C.setFillColor(LIGHT); C.rect(M, y-row*14-11, CW, 14, fill=1, stroke=0)
    C.setFillColor(INK); C.setFont('Courier-Bold',8.2); C.drawString(x+6, y-row*14-8, code)
    C.setFont('Helvetica',8.4); C.drawString(x+78, y-row*14-8, name)
y-=len(glossary)//2*14+4
y=para('Expansions come from published descriptions of the Z-Alizadeh Sani feature table (docs/FEATURE_LABELS.md). Ambiguous codes (Atypical, Length, CR) stay unexpanded; no units are added.', y-2, size=7.8, color=MUTED)
y=heading('Two methods, two explicit contribution spaces',y-10)
for i,(head,text) in enumerate([('CAD + LAD','Linear SHAP<br/><b>Positive-class log-odds</b><br/>Baseline + contributions reconstruct the decision score; sigmoid returns probability.'),('LCX + RCA','TreeSHAP<br/><b>Positive-class probability space</b><br/>Baseline + contributions reconstruct the forest probability directly.')]):
    x=M+i*(CW+12)/2; bw=(CW-12)/2
    C.setFillColor(LIGHT); C.roundRect(x,y-86,bw,86,6,fill=1,stroke=0)
    para(f'<b>{head}</b><br/>{text}',y-9,x=x+12,width=bw-24,size=9.3,max_height=72)
y-=100
y=para('A deterministic <b>100-record development-only reference</b> is frozen. All <b>55 source variables</b> are retained; one-hot blocks aggregate to their source feature, and the remaining factors are summed so nothing is hidden. Reconstruction tolerance: <b>1e-10 log-odds / 1e-6 probability</b>; the interface shows a verified badge and keeps baseline, residual and identity fingerprints one click away.', y, size=9.3)
callout('<b>SHAP explains model behavior.</b> Associations do not establish causality, clinical mechanism or treatment. The reference set is not a healthy control cohort.', y-12, height=50, warning=True)
C.showPage()

# PAGE 6: integrity
title(6,'Integrity + limitations','Reproducible, with honest boundaries',
      'The scientific V1 product remains frozen. Engineering checks and separately bounded research do not turn a small same-source evaluation into clinical validation.')
y=H-135
y=heading('Engineering evidence',y)
y=para('<b>Hosted GitHub Actions passed</b> (4 Oct 2026, ubuntu-24.04) for the published <b>main</b> and <b>v1.0.0</b> commits: <b>134 Python + 75 frontend tests</b>, frozen-model/SHAP smoke checks and all <b>256 protected files byte-identical</b> (runs 37225107078 / 37225107079). The same suites passed earlier on macOS ARM64 and clean Ubuntu ARM64; desktop Chromium / Firefox / Safari workflows and Docker were verified locally.',y)
y=para('<b>256 protected scientific files</b> are checksum verified: model, schema, split, receipt, SHAP and anatomy assets remain fixed. Lazy loading cut initial JavaScript from 1,216,295 to 266,391 bytes (about <b>78%</b>); the October design update (presentation only: layout, labels, color scale) is 259,557 bytes and passed the same 75 frontend tests and protected-file check locally.',y-11)
y=heading('What we learned after final evaluation',y-14)
y=para('After weak LCX/RCA sensitivity, we preregistered separate <b>post-holdout, development-only</b> studies. Threshold/model and multi-task approaches failed their predefined <b>joint gates</b>. V1, evaluated once on the prespecified 61-record same-source holdout, remained unchanged.',y)
y=para('V2 tested thresholds, elastic-net, forests/cost sensitivity and XGBoost. V2.1 tested a small four-task network: RCA\'s mean scores were higher on paired development folds, but LCX and CAD preservation failed. No final all-development neural candidate was fitted. <b>Neither study is deployed or independently validated.</b>',y-11)
y=heading('Limits that govern interpretation',y-14)
y=para('Only 303 source records; just 61 final-test records. Same-source holdout; no independent external cohort. True patient IDs are unverified despite duplicate-group protection. Uncalibrated probabilities. Weak LCX/RCA sensitivity at the frozen threshold. Separate outputs are not a joint probability model. Reference anatomy only; no lesion localization. No clinical deployment validation.',y)
y=heading('Reproduce the product',y-14)
y=para('<font name="Courier">make install<br/>make prepare<br/>make build<br/>make run PORT=8000</font><br/>Open the printed localhost URL and load the public development example. Dependencies need network for installation; the prepared local product can run offline. The repository includes frozen pipelines, sources/provenance, deterministic locks, Docker instructions and integrity checks.',y,size=9.5)
y=heading('Sources and accompanying evidence',y-17)
y=para('Dataset: UCI Extension of Z-Alizadeh Sani, DOI <link href="https://doi.org/10.24432/C5461K" color="#007F83">10.24432/C5461K</link>, CC BY 4.0.<br/>Anatomy: <link href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" color="#007F83">current BodyParts3D archive license</link>, CC BY 4.0.<br/>Repository: <link href="https://github.com/AbhikRao/CardioScope" color="#007F83">github.com/AbhikRao/CardioScope</link> (MIT). README; docs/MODELING.md, FINAL_EVALUATION.md, EXPLANATIONS.md, HARDENING.md, V2_LCX_RCA.md and V21_MULTITASK.md. Report numbers are copied from saved aggregate evidence; no evaluation or training is invoked by this source. Upstream dataset, anatomy and dependency attribution is retained.',y,size=8.8,color=MUTED)
C.showPage()
C.save()
print(f'Created {OUT.relative_to(ROOT)} (6 explicit pages)')
