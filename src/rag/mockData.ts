// Illustrative data for the stage 2 EXAMPLE MOCKUP screens. Not measured, not from a real Cognee/OKF run.

export type OkfClass = 'Document' | 'Table' | 'CADGeometry' | 'Correspondence' | 'Unclassified'

export interface ExtractionJob {
  object: string
  s3: string
  okfClass: OkfClass
  extractor: string
  entities: number
  confidence: number | null
}

export const JOBS: ExtractionJob[] = [
  { object: 'RFQ_Package_Meridian.pdf', s3: 's3://bam-intake/rfq-2026-0147/RFQ_Package_Meridian.pdf', okfClass: 'Document', extractor: 'pypdf + Pydantic AI', entities: 9, confidence: 0.94 },
  { object: 'BOM_RevC.xlsx', s3: 's3://bam-intake/rfq-2026-0147/BOM_RevC.xlsx', okfClass: 'Table', extractor: 'openpyxl', entities: 16, confidence: 0.99 },
  { object: 'MPW-4421-bracket.step', s3: 's3://bam-intake/rfq-2026-0147/MPW-4421-bracket.step', okfClass: 'CADGeometry', extractor: 'cadquery', entities: 102, confidence: null },
  { object: 'MPW-4422-housing.step', s3: 's3://bam-intake/rfq-2026-0147/MPW-4422-housing.step', okfClass: 'CADGeometry', extractor: 'cadquery', entities: 84, confidence: null },
  { object: 'email-thread.eml', s3: 's3://bam-intake/rfq-2026-0147/email-thread.eml', okfClass: 'Correspondence', extractor: 'mailparser', entities: 3, confidence: 0.91 },
  { object: 'meridian-logo.png', s3: 's3://bam-intake/rfq-2026-0147/meridian-logo.png', okfClass: 'Unclassified', extractor: '—', entities: 0, confidence: null },
]

export const COVERAGE_META: Record<OkfClass, string> = {
  Document: 'RFQ pdf · Spec QA-101',
  Table: 'BOM lines + headers',
  CADGeometry: '2 STEP files · bodies/faces',
  Correspondence: 'email-thread.eml',
  Unclassified: 'file type not in the accepted intake types (1.4)',
}

/** Graph filter chip counts as shown in the 2.1 mockup. */
export const CLASS_COUNTS: [OkfClass, number][] = [['Document', 9], ['Table', 2], ['CADGeometry', 2], ['Correspondence', 1]]

export type NodeKind = 'request' | 'document' | 'table' | 'cad' | 'correspondence' | 'material' | 'customer'

export interface GraphNodeDef {
  id: string
  label: string
  sub?: string
  kind: NodeKind
  okfClass: string
  /** Filter chip this node belongs to, if any. */
  filter?: OkfClass
  x: number
  y: number
  /** Appears once this many extraction jobs have finished. */
  after: number
  sources: string[]
  relations: string
  facts: string
  confidence: number
}

export const NODES: GraphNodeDef[] = [
  { id: 'rfq', label: 'RFQ-2026-0147', kind: 'request', okfClass: 'Request', x: 400, y: 40, after: 1, sources: ['RFQ_Package_Meridian.pdf'], relations: '3 documents · 1 customer', facts: '"quote due 2026-10-20"', confidence: 0.97 },
  { id: 'bom', label: 'BOM_RevC', sub: '.xlsx', kind: 'table', okfClass: 'Table', filter: 'Table', x: 150, y: 160, after: 2, sources: ['BOM_RevC.xlsx'], relations: '2 parts · 1 material', facts: '"14 rows parsed, 2 flagged"', confidence: 0.99 },
  { id: 'pkg', label: 'RFQ_Package', sub: '.pdf', kind: 'document', okfClass: 'Document', filter: 'Document', x: 640, y: 150, after: 1, sources: ['RFQ_Package_Meridian.pdf'], relations: '1 material · 1 spec', facts: '"target price per lot"', confidence: 0.94 },
  { id: 'email', label: 'email-thread', sub: '.eml', kind: 'correspondence', okfClass: 'Correspondence', filter: 'Correspondence', x: 400, y: 190, after: 5, sources: ['email-thread.eml'], relations: '1 customer', facts: '"Rev C replaces Rev B"', confidence: 0.91 },
  { id: 'step', label: 'MPW-4421', sub: '.step', kind: 'cad', okfClass: 'CADGeometry', filter: 'CADGeometry', x: 120, y: 330, after: 3, sources: ['MPW-4421-bracket.step'], relations: '1 BOM line', facts: '"102 faces, 1 body"', confidence: 0.88 },
  { id: 'spec', label: 'Spec_QA-', sub: '101.pdf', kind: 'document', okfClass: 'Document', filter: 'Document', x: 690, y: 300, after: 1, sources: ['RFQ_Package_Meridian.pdf'], relations: '1 material', facts: '"mill cert per lot"', confidence: 0.93 },
  { id: 'al', label: '6061-T6', sub: 'material', kind: 'material', okfClass: 'Material', x: 290, y: 340, after: 2, sources: ['BOM_RevC.xlsx'], relations: '7 parts · 2 specs', facts: '"mill cert required" · "tolerance ±0.1mm"', confidence: 0.94 },
  { id: 'ss', label: '17-4PH SS', sub: 'material', kind: 'material', okfClass: 'Material', x: 510, y: 340, after: 4, sources: ['RFQ_Package_Meridian.pdf', 'MPW-4422-housing.step'], relations: '1 part · 1 spec', facts: '"MPW-4422 housing only"', confidence: 0.92 },
  { id: 'meridian', label: 'Meridian', sub: 'customer', kind: 'customer', okfClass: 'Customer', x: 400, y: 420, after: 5, sources: ['email-thread.eml', 'RFQ_Package_Meridian.pdf'], relations: '1 RFQ', facts: '"repeat customer"', confidence: 0.96 },
]

export const EDGES: { source: string; target: string; label?: string }[] = [
  { source: 'rfq', target: 'bom', label: 'has_document' },
  { source: 'rfq', target: 'pkg', label: 'has_document' },
  { source: 'rfq', target: 'email' },
  { source: 'bom', target: 'step', label: 'has_part' },
  { source: 'bom', target: 'al', label: 'has_material' },
  { source: 'pkg', target: 'ss', label: 'requires_material' },
  { source: 'pkg', target: 'spec' },
  { source: 'spec', target: 'ss' },
  { source: 'email', target: 'al' },
  { source: 'al', target: 'meridian', label: 'quoted_for' },
  { source: 'ss', target: 'meridian' },
]

export interface SchemaDef {
  name: string
  okfSource: string
  fields: string
  mapsTo: string
  status: 'reviewed' | 'selected' | 'draft'
  code: string
}

export const SCHEMAS: SchemaDef[] = [
  { name: 'Requirement', okfSource: 'Document · RFQ pdf', fields: 'id, text, category, tolerance, source_page', mapsTo: 'BAM-RFQ-001-01', status: 'reviewed',
    code: 'class Requirement(BaseModel):\n    id: str\n    text: str\n    category: Literal["dimensional", "material", "commercial"]\n    tolerance: str | None\n    source_page: int\n\n# source: RFQ_Package_Meridian.pdf\n# 9 requirements extracted\n' },
  { name: 'QuoteLine', okfSource: 'Table · BOM xlsx', fields: 'line_no, part_no, desc, material, qty, unit_price', mapsTo: 'BAM-RFQ-001-02/04', status: 'selected',
    code: 'class QuoteLine(BaseModel):\n    line_no: int\n    part_no: str  # MPW-NNNN\n    description: str\n    material: Material\n    qty: int = Field(gt=0)\n    unit_price: Decimal | None\n    flags: list[ExceptionRecord]\n\n# source: BOM_RevC.xlsx · sheet "BOM"\n# 14 rows parsed · 2 flagged\n' },
  { name: 'ExceptionRecord', okfSource: 'Table + Rules master', fields: 'rule_id, line_ref, severity, route, resolved_by', mapsTo: 'BAM-RFQ-001-03', status: 'draft',
    code: 'class ExceptionRecord(BaseModel):\n    rule_id: str\n    line_ref: int\n    severity: Literal["low", "high", "blocking"]\n    route: str\n    resolved_by: str | None\n\n# source: BOM_RevC.xlsx + Rules master\n' },
  { name: 'RFQSession', okfSource: 'Correspondence · eml', fields: 'customer, due_date, parts_count, completeness', mapsTo: 'BAM-RFQ-001', status: 'draft',
    code: 'class RFQSession(BaseModel):\n    customer: str\n    due_date: date\n    parts_count: int\n    completeness: float = Field(ge=0, le=1)\n\n# source: email-thread.eml\n' },
  { name: 'MaterialCert', okfSource: 'Document · Spec QA-101', fields: 'material, cert_type, required, attached', mapsTo: 'BAM-QA-002-01', status: 'draft',
    code: 'class MaterialCert(BaseModel):\n    material: Material\n    cert_type: Literal["mill", "conformance"]\n    required: bool\n    attached: bool\n\n# source: Spec_QA-101.pdf\n' },
]

export interface Citation { label: string; s3: string }
export interface QaAnswer { match: RegExp; answer: string; citations: Citation[] }

export const QA: QaAnswer[] = [
  { match: /17-4|cert/i, answer: 'MPW-4422 (housing) is the only 17-4PH part in RFQ-2026-0147. Spec QA-101 requires a mill cert per lot. Target price is missing on line 2.',
    citations: [{ label: 'BOM_RevC.xlsx · line 2', s3: 's3://bam-intake/rfq-2026-0147/BOM_RevC.xlsx#line=2' }, { label: 'Spec_QA-101.pdf · §3.2', s3: 's3://bam-intake/rfq-2026-0147/RFQ_Package_Meridian.pdf#spec-qa-101' }, { label: 'RFQ pdf · p.4', s3: 's3://bam-intake/rfq-2026-0147/RFQ_Package_Meridian.pdf#page=4' }] },
  { match: /toleranc|4421/i, answer: 'MPW-4421 (bracket) is 6061-T6 with a general tolerance of ±0.1 mm; the hole pattern is called out at ±0.05 mm.',
    citations: [{ label: 'MPW-4421-bracket.step', s3: 's3://bam-intake/rfq-2026-0147/MPW-4421-bracket.step' }, { label: 'RFQ pdf · p.6', s3: 's3://bam-intake/rfq-2026-0147/RFQ_Package_Meridian.pdf#page=6' }] },
  { match: /rev ?c|change/i, answer: 'Rev C replaces Rev B: line 2 material changed to 17-4PH SS and the quantity of MPW-4421 increased from 200 to 250.',
    citations: [{ label: 'email-thread.eml', s3: 's3://bam-intake/rfq-2026-0147/email-thread.eml' }, { label: 'BOM_RevC.xlsx · line 2', s3: 's3://bam-intake/rfq-2026-0147/BOM_RevC.xlsx#line=2' }] },
]

export const QA_SUGGESTIONS = ['Which parts use 17-4PH and need certs?', 'Tolerances on MPW-4421?', 'What did Meridian change in Rev C?']
