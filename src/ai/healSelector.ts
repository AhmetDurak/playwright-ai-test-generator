import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createProvider } from './providers/index.ts';

const PROJECT_ROOT = process.cwd();
const PROMPT_PATH = path.join(PROJECT_ROOT, 'src/prompts/healSelector.prompt.md');

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

  const provider = createProvider();

  const [systemPrompt, rawHtml] = await Promise.all([
    readFile(PROMPT_PATH, 'utf-8'),
    readFile(path.resolve(PROJECT_ROOT, htmlFilePath), 'utf-8'),
  ]);

  const html = stripNoise(rawHtml);
  const userMessage = `## Old selector\n${oldSelector}\n\n## Page HTML\n\`\`\`html\n${html}\n\`\`\``;

  const responseText = await provider.complete({
    system: systemPrompt,
    prompt: userMessage,
    maxTokens: MAX_TOKENS,
  });

  console.log(`(via ${provider.name}:${provider.model})\n`);
  console.log(responseText.trim());
}

main().catch((error) => {
  console.error('healSelector failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
