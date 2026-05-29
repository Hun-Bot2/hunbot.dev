import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const packageJson = JSON.parse(read('package.json'));
assert.match(packageJson.scripts?.['csp:validate'] ?? '', /validate-csp\.mjs/);

const vercelConfig = JSON.parse(read('vercel.json'));
const cspHeader = vercelConfig.headers?.[0]?.headers?.find((header) => header.key === 'Content-Security-Policy');
assert.ok(cspHeader, 'Content-Security-Policy header is required.');
assert.doesNotMatch(cspHeader.value, /'unsafe-eval'/);
assert.match(cspHeader.value, /object-src 'none'/);
assert.match(cspHeader.value, /base-uri 'self'/);
assert.match(cspHeader.value, /frame-ancestors 'none'/);

const header = read('src/components/Header.astro');
assert.match(header, /\/scripts\/header-menu\.js/);
assert.doesNotMatch(header, /mobile menu toggle/i);

const headerMenu = read('public/scripts/header-menu.js');
assert.match(headerMenu, /menuToggle/);
assert.match(headerMenu, /mobileMenu/);
assert.match(headerMenu, /instanceof Node/);

const inventory = read('docs/csp-script-inventory.md');
assert.match(inventory, /Header\.astro/);
assert.match(inventory, /unsafe-inline/);
assert.match(inventory, /unsafe-eval/);

const thirdPartyInventory = read('docs/third-party-services.md');
for (const requiredDomain of [
	'gc.zgo.at',
	'hunbot.goatcounter.com',
	'giscus.app',
	'www.googletagmanager.com',
	'fonts.googleapis.com',
	'fonts.gstatic.com',
	'cdn.jsdelivr.net',
]) {
	assert.match(thirdPartyInventory, new RegExp(requiredDomain.replaceAll('.', '\\.')));
}
assert.match(thirdPartyInventory, /No document viewer domains are approved/);

const giscus = read('src/components/GiscusComments.astro');
assert.match(giscus, /repoLooksValid/);
assert.match(giscus, /Giscus 설정이 누락되어 댓글을 숨겼습니다/);

console.log('Validated CSP hardening source, extracted header script, script inventory, and third-party service inventory.');
