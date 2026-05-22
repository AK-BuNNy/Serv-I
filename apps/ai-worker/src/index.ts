import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { AiProviderFactory } from './providers/ai-provider.factory';

const prisma = new PrismaClient();

// Create the AI provider from env
const aiProvider = AiProviderFactory.create();
const embeddingProvider = AiProviderFactory.createEmbeddingProvider();

console.log('');
console.log('╔══════════════════════════════════════════════╗');
console.log('║        Serv-I AI Worker                      ║');
console.log('╠══════════════════════════════════════════════╣');
console.log(`║  🤖 Chat:      ${aiProvider.name.padEnd(29)}║`);
console.log(`║  📐 Embedding: ${embeddingProvider.name.padEnd(29)}║`);
console.log('╚══════════════════════════════════════════════╝');
console.log('');

/**
 * Pre-classify log lines using regex patterns before AI analysis.
 * This provides context to the AI model for better classification.
 */
function preClassify(line: string): { possibleCategory: string; context: string } {
  const lower = line.toLowerCase();

  // SSH brute force patterns
  if (/failed password|invalid user|authentication failure/i.test(line)) {
    return {
      possibleCategory: 'brute-force',
      context: 'This appears to be a failed SSH/authentication attempt. Check for brute-force patterns.',
    };
  }

  // Port scan patterns
  if (/nmap|scan|port.*refused|connection.*reset/i.test(line)) {
    return {
      possibleCategory: 'port-scan',
      context: 'This log may indicate port scanning or network reconnaissance activity.',
    };
  }

  // Privilege escalation
  if (/sudo|su:|root.*session|privilege|escalat/i.test(line)) {
    return {
      possibleCategory: 'privilege-escalation',
      context: 'This may be a privilege escalation attempt or unauthorized sudo usage.',
    };
  }

  // Web attack patterns
  if (/sql.*inject|union.*select|xss|<script|\.\.\/|path.*traversal/i.test(line)) {
    return {
      possibleCategory: 'web-attack',
      context: 'This appears to be a web application attack (SQLi, XSS, or path traversal).',
    };
  }

  // DDoS / flood patterns
  if (/flood|ddos|rate.*limit|too.*many.*request|429/i.test(line)) {
    return {
      possibleCategory: 'dos-attack',
      context: 'This may indicate a denial-of-service or request flooding attack.',
    };
  }

  // HTTP errors
  if (/\s(4\d{2}|5\d{2})\s/i.test(line)) {
    return {
      possibleCategory: 'suspicious-activity',
      context: 'HTTP error status code detected. Could indicate web attacks or misconfigurations.',
    };
  }

  return {
    possibleCategory: 'unknown',
    context: 'Analyze this log line for any security-relevant activity.',
  };
}

const worker = new Worker(
  'security-events',
  async (job) => {
    const { path: logPath, line, logEntryId } = job.data;

    console.log(`[Job ${job.id}] Processing log from ${logPath}`);
    console.log(`  Line: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);

    try {
      // Step 1: Pre-classify for context
      const { context } = preClassify(line);

      // Step 2: AI threat classification
      console.log(`  → Classifying with ${aiProvider.name}...`);
      const classification = await aiProvider.classifyThreat(line, context);
      console.log(`  → Severity: ${classification.severity} | Category: ${classification.category} | Confidence: ${classification.confidence}`);

      // Step 3: Generate embedding
      console.log(`  → Generating embedding with ${embeddingProvider.name}...`);
      const embedding = await embeddingProvider.generateEmbedding(
        `${classification.summary} ${line}`,
      );

      // Step 4: Store incident in database
      const incident = await prisma.incident.create({
        data: {
          source: logPath,
          severity: classification.severity,
          category: classification.category,
          rawLog: line,
          message: classification.summary,
          aiSummary: classification.summary,
          aiProvider: aiProvider.name,
          confidence: classification.confidence,
          indicators: classification.indicators,
        },
      });

      // Step 5: Store embedding via raw SQL (Prisma doesn't support vector type natively)
      const vectorStr = `[${embedding.join(',')}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE incidents SET embedding = $1::vector WHERE id = $2`,
        vectorStr,
        incident.id,
      );

      // Step 6: Mark log entry as processed
      if (logEntryId) {
        await prisma.logEntry.update({
          where: { id: logEntryId },
          data: { processed: true },
        });
      }

      console.log(`  ✓ Incident created: ${incident.id}`);

      return {
        success: true,
        incidentId: incident.id,
        severity: classification.severity,
        category: classification.category,
        provider: aiProvider.name,
      };
    } catch (error) {
      console.error(`  ✗ Error processing job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    concurrency: 3,
  },
);

worker.on('completed', (job) => {
  console.log(`[Job ${job.id}] ✓ Completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Job ${job?.id}] ✗ Failed:`, err.message);
});

console.log('AI worker listening for security events...');
