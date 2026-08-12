import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createProvider } from './providers/index.ts';

const PROJECT_ROOT = process.cwd();
const PROMPT_PATH = path.join(PROJECT_ROOT, 'src/prompts/analyzeFailure.prompt.md');
const REPORT_PATH = path.join(PROJECT_ROOT, 'reports/failure-summary.md');

const MAX_TOKENS = 2048;

interface ReporterError {
  message?: string;
}

interface ReporterResult {
  status: string;
  error?: ReporterError;
}

interface ReporterTest {
  title: string;
  results: ReporterResult[];
}

interface ReporterSpec {
  title: string;
  file?: string;
  tests: ReporterTest[];
}

interface ReporterSuite {
  title: string;
  file?: string;
  specs?: ReporterSpec[];
  suites?: ReporterSuite[];
}

interface ReporterRoot {
  suites: ReporterSuite[];
}

interface Failure {
  title: string;
  file: string;
  message: string;
}

function collectFailures(suites: ReporterSuite[], inheritedFile?: string): Failure[] {
  const failures: Failure[] = [];

  for (const suite of suites) {
    const file = suite.file ?? inheritedFile ?? 'unknown';

    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        const failedResult = test.results.find((r) => r.status === 'failed' || r.status === 'timedOut');
        if (failedResult) {
          failures.push({
            title: spec.title,
            file: spec.file ?? file,
            message: failedResult.error?.message ?? `Status: ${failedResult.status}`,
          });
        }
      }
    }

    if (suite.suites) {
      failures.push(...collectFailures(suite.suites, file));
    }
  }

  return failures;
}

function formatFailures(failures: Failure[]): string {
  return failures
    .map(
      (f, i) =>
        `### Failure ${i + 1}: ${f.title}\n- File: ${f.file}\n- Error:\n\`\`\`\n${f.message}\n\`\`\``
    )
    .join('\n\n');
}

async function main(): Promise<void> {
  const resultsPath = process.argv[2];
  if (!resultsPath) {
    console.error('Usage: node src/ai/analyzeFailure.ts <results.json>');
    process.exit(1);
  }

  const raw = await readFile(path.resolve(PROJECT_ROOT, resultsPath), 'utf-8');
  const report: ReporterRoot = JSON.parse(raw);
  const failures = collectFailures(report.suites);

  if (failures.length === 0) {
    console.log('No failing tests found in the report.');
    return;
  }

  const provider = createProvider();
  const systemPrompt = await readFile(PROMPT_PATH, 'utf-8');
  const userMessage = `## Failing tests (${failures.length})\n\n${formatFailures(failures)}`;

  const responseText = await provider.complete({
    system: systemPrompt,
    prompt: userMessage,
    maxTokens: MAX_TOKENS,
  });

  const summary = responseText.trim();

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${summary}\n`, 'utf-8');

  console.log(`(via ${provider.name}:${provider.model})\n`);
  console.log(summary);
  console.log('\nSaved to: reports/failure-summary.md');
}

main().catch((error) => {
  console.error('analyzeFailure failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
