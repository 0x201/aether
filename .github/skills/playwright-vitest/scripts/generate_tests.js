#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: node generate_tests.js --root <path> --type <e2e|unit|all> [--open-pr]');
}

// Simple arg parser using Node built-ins (no third-party libs)
function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--root') {
      out.root = args[++i];
    } else if (a === '--type') {
      out.type = args[++i];
    } else if (a === '--open-pr') {
      out['open-pr'] = true;
    } else if (a === '--help' || a === '-h') {
      out.help = true;
    } else if (a.startsWith('--') && a.includes('=')) {
      const [k, v] = a.slice(2).split('=');
      out[k] = v;
    } else {
      // ignore unknown
    }
  }
  return out;
}

const argv = parseArgs();
if (argv.help) {
  usage();
  process.exit(0);
}
const root = path.resolve(argv.root || process.cwd());
const type = argv.type || 'all';
const openPr = !!argv['open-pr'];
const { execSync } = require('child_process');

function getPackageManager(root) {
  if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(root, 'package-lock.json'))) return 'npm';
  return 'npm';
}

function installPackages(pkgs, dev = true) {
  const pm = getPackageManager(root);
  let cmd = '';
  const devFlag = pm === 'yarn' ? '--dev' : (dev ? '-D' : '');
  if (pm === 'pnpm') {
    cmd = `pnpm add ${devFlag} ${pkgs.join(' ')}`;
  } else if (pm === 'yarn') {
    cmd = `yarn add ${devFlag} ${pkgs.join(' ')}`;
  } else {
    cmd = `npm install ${devFlag} ${pkgs.join(' ')}`;
  }
  console.log(`Installing: ${pkgs.join(' ')} using ${pm}...`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: root });
    console.log('Install finished.');
  } catch (err) {
    console.error('Package install failed:', err.message);
    process.exit(1);
  }
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writeIfNotExists(filePath, content) {
  if (fs.existsSync(filePath)) {
    console.log(`Skipped (exists): ${filePath}`);
    return;
  }
  fs.writeFileSync(filePath, content, { encoding: 'utf8' });
  console.log(`Created: ${filePath}`);
}

// Templates
const playwrightSpec = `import { test, expect } from '@playwright/test';

test.describe('App - Smoke', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/./);
    await expect(page.getByRole('main')).toBeVisible();
  });
});
`;

const vitestSpec = `import { describe, it, expect } from 'vitest';

// Replace with actual module or component imports
// import { myFunction } from '../../src/utils/myFunction';

describe('Sample unit', () => {
  it('basic arithmetic sanity', () => {
    expect(1 + 1).toBe(2);
  });
});
`;

function main() {
  // basic validation
  const pkg = path.join(root, 'package.json');
  if (!fs.existsSync(pkg)) {
    console.warn('Warning: package.json not found at root. Proceeding anyway.');
  }

  // Detect and install missing dependencies: vitest and Playwright
  let pkgJson = {};
  try {
    if (fs.existsSync(pkg)) pkgJson = JSON.parse(fs.readFileSync(pkg, 'utf8'));
  } catch (e) {
    console.warn('Could not parse package.json:', e.message);
  }

  const deps = Object.assign({}, pkgJson.dependencies || {}, pkgJson.devDependencies || {});
  const need = [];
  if (!('vitest' in deps)) need.push('vitest');
  if (!('@playwright/test' in deps) && !('playwright' in deps)) need.push('@playwright/test', 'playwright');
  if (need.length) {
    console.log('Missing test dependencies detected:', need.join(', '));
    installPackages(need, true);
  }

  if (type === 'e2e' || type === 'all') {
    const e2eDir = path.join(root, 'tests', 'e2e');
    ensureDir(e2eDir);
    writeIfNotExists(path.join(e2eDir, 'homepage.spec.ts'), playwrightSpec);
  }

  if (type === 'unit' || type === 'all') {
    const unitDir = path.join(root, 'tests', 'unit');
    ensureDir(unitDir);
    writeIfNotExists(path.join(unitDir, 'sample.spec.tsx'), vitestSpec);
  }

  console.log('\nGeneration complete. Next steps:');
  console.log(`- Install dependencies if needed: pnpm install`);
  console.log(`- Playwright: npx playwright install --with-deps`);
  console.log(`- Run E2E: npx playwright test`);
  console.log(`- Run unit: pnpm vitest`);

  if (openPr) {
    const branch = `test-gen/${Date.now()}`;
    console.log('\nTo create a branch and push the patch, run:');
    console.log(`git checkout -b ${branch}`);
    console.log('git add tests && git commit -m "chore(tests): scaffold Playwright/Vitest tests"');
    console.log('git push --set-upstream origin ' + branch);
    console.log('Then open a PR from that branch.');
  }
}

main();
