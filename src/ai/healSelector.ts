import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const PROMPT_PATH = path.join(PROJECT_ROOT, 'src/prompts/healSelector.prompt.md');

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 2048;

function stripNoise(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

async function main(): Promise<void> {
  const [htmlFilePath, oldSelector] = process.argv.slice(2);
  if (!htmlFilePath || !oldSelector) {
    console.error('Usage: node src/ai/healSelector.ts <html-file> <old-selector>');
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY. Set it in your .env file.');
    process.exit(1);
  }

  const [systemPrompt, rawHtml] = await Promise.all([
    readFile(PROMPT_PATH, 'utf-8'),
    readFile(path.resolve(PROJECT_ROOT, htmlFilePath), 'utf-8'),
  ]);

  const html = stripNoise(rawHtml);
  const userMessage = `## Old selector\n${oldSelector}\n\n## Page HTML\n\`\`\`html\n${html}\n\`\`\``;

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

  console.log(textBlock.text.trim());
}

main().catch((error) => {
  console.error('healSelector failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
