import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const PROMPT_PATH = path.join(PROJECT_ROOT, 'src/prompts/generateTest.prompt.md');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'tests/e2e/ai-generated');
const CONTEXT_FILES = [
  'pages/LoginPage.ts',
  'pages/InventoryPage.ts',
  'pages/CartPage.ts',
  'pages/CheckoutPage.ts',
  'tests/fixtures/page-fixtures.ts',
];

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 2048;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
}

function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

async function loadContext(): Promise<string> {
  const sections = await Promise.all(
    CONTEXT_FILES.map(async (relativePath) => {
      const fullPath = path.join(PROJECT_ROOT, relativePath);
      if (!existsSync(fullPath)) return '';
      const content = await readFile(fullPath, 'utf-8');
      return `### ${relativePath}\n\`\`\`typescript\n${content}\n\`\`\`\n`;
    })
  );
  return sections.filter(Boolean).join('\n');
}

function stripCodeFences(text: string): string {
  const fenced = text.match(/```(?:typescript|ts)?\n([\s\S]*?)```/);
  return (fenced ? fenced[1] : text).trim() + '\n';
}

async function main(): Promise<void> {
  const scenario = process.argv.slice(2).join(' ').trim();
  if (!scenario) {
    console.error('Usage: node src/ai/generateTest.ts "<scenario description>"');
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY. Set it in your .env file.');
    process.exit(1);
  }

  const systemPrompt = await readFile(PROMPT_PATH, 'utf-8');
  const context = await loadContext();
  const userMessage = `## Existing Page Objects & Fixtures\n${context}\n## Scenario\n${scenario}`;

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    console.error('No text content returned from the model.');
    process.exit(1);
  }

  const code = stripCodeFences(textBlock.text);

  await mkdir(OUTPUT_DIR, { recursive: true });
  const fileName = `ai_${timestamp()}_${slugify(scenario)}.spec.ts`;
  const outputPath = path.join(OUTPUT_DIR, fileName);
  await writeFile(outputPath, code, 'utf-8');

  console.log(`Generated: tests/e2e/ai-generated/${fileName}`);
  console.log(`Review and run with: npx playwright test tests/e2e/ai-generated/${fileName}`);
}

main().catch((error) => {
  console.error('generateTest failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
