/**
 * Serv-I AI Provider Interface
 *
 * All AI providers (OpenAI, Gemini, Claude) implement this interface.
 * Swap providers by changing the AI_PROVIDER env var.
 */

export interface ThreatClassification {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  summary: string;
  indicators: string[];
  confidence: number;
}

export interface IncidentData {
  id: string;
  source: string;
  severity: string;
  category: string;
  rawLog: string;
  message: string;
  aiSummary?: string;
  indicators?: string[];
  confidence?: number;
  createdAt: Date;
}

export interface IAiProvider {
  /** Provider name identifier */
  readonly name: string;

  /** Classify a raw log line into a structured threat assessment */
  classifyThreat(logLine: string, context?: string): Promise<ThreatClassification>;

  /** Generate a vector embedding for semantic search */
  generateEmbedding(text: string): Promise<number[]>;

  /** Generate a full markdown incident report from incident data */
  generateReport(incident: IncidentData): Promise<string>;
}

export const THREAT_CLASSIFICATION_PROMPT = `You are a cybersecurity threat analyst. Analyze the following log line and classify it.

Respond ONLY with valid JSON matching this exact schema:
{
  "severity": "critical" | "high" | "medium" | "low" | "info",
  "category": "<string: e.g. brute-force, port-scan, privilege-escalation, malware, data-exfiltration, unauthorized-access, dos-attack, suspicious-activity>",
  "summary": "<string: concise human-readable summary of the threat>",
  "indicators": ["<array of IOCs: IPs, usernames, file paths, ports, etc.>"],
  "confidence": <number 0-1: how confident you are this is a real threat>
}

Rules:
- If the log is benign/routine, set severity to "info" and confidence to a low value.
- Extract all relevant IOCs (IP addresses, usernames, file paths, ports).
- Be specific in your category classification.
- Keep the summary concise but informative (1-2 sentences).`;

export const REPORT_GENERATION_PROMPT = `You are a senior cybersecurity analyst writing an incident report. Generate a professional, detailed markdown incident report based on the provided incident data.

The report should include:
1. **Executive Summary** — brief overview for leadership
2. **Incident Details** — timestamps, source, category, severity
3. **Technical Analysis** — what happened, attack vectors, IOCs
4. **Impact Assessment** — potential damage, affected systems
5. **Recommendations** — immediate actions and long-term mitigations
6. **Timeline** — chronological sequence of events

Use proper markdown formatting with headers, bullet points, and code blocks where appropriate.
Keep the tone professional and actionable.`;
