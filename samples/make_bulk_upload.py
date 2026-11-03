"""Generate bulk-upload test files for 1.1 Upload (matches the Meridian RFQ-2026-0147 EXAMPLE dataset).

python samples/make_bulk_upload.py  ->  samples/bulk-upload/{valid,edge-cases,over-limit}
"""
import os, zipfile
from pathlib import Path
from docx import Document
from openpyxl import Workbook
from pptx import Presentation
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

OUT = Path(__file__).parent / 'bulk-upload'
V, E, O = OUT / 'valid', OUT / 'edge-cases', OUT / 'over-limit'
for d in (V, E, O): d.mkdir(parents=True, exist_ok=True)


def pdf(path, title, lines, pad_mb=0):
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle(title)
    y = 800
    c.setFont('Helvetica-Bold', 14); c.drawString(50, y, title); y -= 30
    c.setFont('Helvetica', 10)
    for ln in lines:
        if y < 60: c.showPage(); c.setFont('Helvetica', 10); y = 800
        c.drawString(50, y, ln); y -= 16
    c.save()
    if pad_mb:  # ponytail: trailing bytes after %%EOF; readers ignore them, upload sees a big file (chunking test)
        with open(path, 'ab') as f: f.write(b'%' + os.urandom(pad_mb * 1024 * 1024))


def docx(path, title, paras):
    d = Document(); d.add_heading(title, 1)
    for p in paras: d.add_paragraph(p)
    d.save(path)


def xlsx(path, sheet, header, rows):
    wb = Workbook(); ws = wb.active; ws.title = sheet
    ws.append(header)
    for r in rows: ws.append(r)
    wb.save(path)


# ---- valid: 12 files, fits one batch (25 files / 250 MB); the 12 MB PDF uploads as 2 chunks
pdf(V / 'RFQ_Package_Meridian.pdf', 'RFQ-2026-0147 - Meridian Aerospace', [
    'Customer: Meridian Aerospace (repeat customer)', 'Quote due: 2026-10-20   Payment terms: Net 45',
    'Line 1: MPW-4421 bracket, 6061-T6 aluminium, qty 500, MIL-A-8625 Type II clear anodize',
    'Line 2: MPW-4422 housing, 17-4PH stainless, qty 120, EN 10204 3.1 cert required',
    'Critical bore tolerance: +/-0.05 mm (MPW-4421)', 'Packaging: ASTM D3951', 'Target pricing attached in Pricing_Targets.xlsx',
    'Quality spec: Spec_QA-101 (mill cert per lot, ultrasonic inspection on housings)'])
pdf(V / 'Spec_QA-101.pdf', 'Spec QA-101 - Supplier Quality Requirements', [
    f'{i}. ' + t for i, t in enumerate([
        'Mill certificate required per material lot.', 'Ultrasonic inspection on all 17-4PH housings.',
        'First article inspection report (AS9102) before production.', 'Non-conformances reported within 24 h.',
        'Traceability by heat number on every part.'], 1)])
pdf(V / 'Drawing_Pack_Scanned.pdf', 'Drawing pack (large scan)', ['MPW-4421 Rev C', 'MPW-4422 Rev C'], pad_mb=12)
docx(V / 'Technical_Requirements.docx', 'Technical requirements - RFQ-2026-0147', [
    'The supplier shall machine MPW-4421 from 6061-T6 to +/-0.1 mm general tolerance, +/-0.05 mm on the critical bore.',
    'MPW-4422 housings shall pass a high-pressure sealing test at 1.5x working pressure.',
    'All parts shall be packaged per ASTM D3951 and labelled with part number, rev and heat number.',
    'Lead time: 4 weeks ARO for line 1, 6 weeks ARO for line 2.'])
docx(V / 'Compliance_Checklist.docx', 'Compliance checklist', [
    'AS9100D certificate - current', 'ITAR registration - not required (commercial parts)',
    'REACH / RoHS declaration - required', 'Conflict minerals report - required annually'])
xlsx(V / 'BOM_RevC.xlsx', 'BOM', ['Line', 'Part No', 'Description', 'Material', 'Qty', 'Rev'], [
    [1, 'MPW-4421', 'Mounting bracket', '6061-T6', 500, 'C'], [2, 'MPW-4422', 'Pressure housing', '17-4PH SS', 120, 'C'],
    [3, 'HW-M6-20', 'Socket head screw M6x20', 'A4-70', 2000, 'A'], [4, 'OR-2-118', 'O-ring 2-118', 'Viton', 240, 'A']])
xlsx(V / 'Pricing_Targets.xlsx', 'Targets', ['Part No', 'Qty', 'Target unit price (USD)', 'Last paid (USD)'], [
    ['MPW-4421', 500, 18.50, 19.75], ['MPW-4422', 120, 142.00, 151.30]])
xlsx(V / 'Tolerance_Table.xlsx', 'Tolerances', ['Feature', 'Nominal (mm)', 'Tol +', 'Tol -', 'Critical'], [
    ['Bore A', 12.0, 0.05, 0.05, 'Y'], ['Flange thickness', 6.0, 0.1, 0.1, 'N'], ['Housing OD', 48.0, 0.08, 0.08, 'Y']])
p = Presentation()
for title, body in [('RFQ-2026-0147 kickoff', 'Meridian Aerospace - 2 machined parts'),
                    ('Scope', 'MPW-4421 bracket (500) + MPW-4422 housing (120)'),
                    ('Risks', '17-4PH lead time; +/-0.05 mm bore; 3.1 certs')]:
    s = p.slides.add_slide(p.slide_layouts[1]); s.shapes.title.text = title; s.placeholders[1].text = body
p.save(V / 'Kickoff_Deck.pptx')
(V / 'email-thread.txt').write_text(
    'From: buyer@meridian.example\nSubject: RE: RFQ-2026-0147\n\n'
    'Rev C replaces Rev B on line 2 (qty bump to 120). Lead time 4 wks ARO is acceptable for line 1.\n'
    'Please confirm EN 10204 3.1 certs for the housing material.\n', encoding='utf-8')
(V / 'Meeting_Notes.txt').write_text(
    'Internal review 2026-10-14\n- Bore tolerance achievable on 5-axis cell\n- Quote anodize outside (2 vendors)\n'
    '- Open question: does Meridian accept DFARS-compliant alternate 17-4PH source?\n', encoding='utf-8')
with zipfile.ZipFile(V / 'CAD_Models.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('MPW-4421-bracket.step', 'ISO-10303-21;\nHEADER;FILE_NAME(\'MPW-4421-bracket.step\');ENDSEC;\nDATA;ENDSEC;\nEND-ISO-10303-21;\n')
    z.writestr('MPW-4422-housing.step', 'ISO-10303-21;\nHEADER;FILE_NAME(\'MPW-4422-housing.step\');ENDSEC;\nDATA;ENDSEC;\nEND-ISO-10303-21;\n')

# ---- edge cases: each one should be filtered out by triage (scanGate.ts), never fatal
(E / 'empty-notes.txt').write_bytes(b'')                       # empty
(E / 'installer.exe').write_bytes(b'MZ' + b'\0' * 1022)        # unsupported type
(E / 'site-photo.png').write_bytes(b'\x89PNG\r\n\x1a\n' + b'\0' * 64)  # unsupported type
(E / 'legacy-spec.doc').write_bytes(b'\xd0\xcf\x11\xe0' + b'\0' * 508)  # unsupported (.doc, not .docx)
(E / '.DS_Store').write_bytes(b'\0\0\0\1Bud1')                 # system
(E / 'Thumbs.db').write_bytes(b'\0' * 64)                      # system
(E / 'desktop.ini').write_text('[.ShellClassInfo]\n')          # system
(E / '~$Technical_Requirements.docx').write_bytes(b'\0' * 162)  # Office lock file (system)
(E / 'ok-in-mixed-set.txt').write_text('A valid file mixed in with the rejects.\n')

# ---- over limit: 30 files > 25-file batch (tests Auto-select what fits / multi-batch waves)
for i in range(1, 31):
    (O / f'supplier-note-{i:02}.txt').write_text(f'Supplier note {i} for RFQ-2026-0147.\n')

import shutil; shutil.make_archive(str(OUT / 'valid-batch'), 'zip', V)  # for "Or upload a ZIP archive"
print(f'Wrote {OUT}')
