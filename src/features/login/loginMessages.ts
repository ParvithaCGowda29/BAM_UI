// Showcase messages on the login panel. Add or remove one line; the carousel adapts.
export interface LoginMessage { headline: string; flow: string }

export const LOGIN_MESSAGES: LoginMessage[] = [
  { headline: 'From discovery document to deployed skill, in one pipeline.', flow: 'Ingest > Retrieve > Build > Validate' },
  { headline: 'Every SOW traces back to its source documents.', flow: 'Sources > Evidence > Score > Approve' },
  { headline: 'Validated code, tested before it ships.', flow: 'Generate > Validate > Test > Deploy' },
  { headline: 'Build in FDE, prove in Staging.', flow: 'Draft > Review > Certify > Release' },
]
