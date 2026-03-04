import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function run(cmd: string): string {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

function main() {
  const changelogPath = resolve(process.cwd(), 'CHANGELOG.md');
  const changelog = readFileSync(changelogPath, 'utf8');

  const hash = run('git rev-parse --short HEAD');
  const message = run('git log -1 --pretty=%s');
  const author = run('git log -1 --pretty=%an');
  const date = run('git log -1 --date=short --pretty=%ad');
  const why = getArgValue('--why');

  if (changelog.includes(`**Commit:** \`${hash}\``)) {
    console.log(`[changelog] El commit ${hash} ya está documentado.`);
    return;
  }

  const autoSection = [
    `## [${date}] - Resumen automático`,
    '',
    '### 🤖 Último cambio',
    `- **Commit:** \`${hash}\``,
    `- **Mensaje:** ${message}`,
    `- **Autor:** ${author}`,
    ...(why ? [`- **Motivo:** ${why}`] : []),
    '',
    '---',
    ''
  ].join('\n');

  const titleLine = '# Changelog - Catastro Integration Fixes';
  const insertionPoint = changelog.indexOf('\n');

  if (!changelog.startsWith(titleLine) || insertionPoint === -1) {
    throw new Error('Formato de CHANGELOG.md no esperado. No se pudo insertar el resumen automático.');
  }

  const updated = `${titleLine}\n\n${autoSection}${changelog.slice(insertionPoint + 1).trimStart()}`;
  writeFileSync(changelogPath, updated, 'utf8');

  console.log(`[changelog] Resumen automático insertado para commit ${hash}.`);
}

main();
