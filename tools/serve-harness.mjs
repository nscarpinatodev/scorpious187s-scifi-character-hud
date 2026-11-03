/*
 * Serve the harness over http, so it can be opened in an ordinary browser tab rather than only
 * from puppeteer with file access. Foundry's own stylesheets, fonts and icons, which the harness
 * links from the install folder, are served under /foundry/.
 *
 *   node tools/serve-harness.mjs        then  http://localhost:8187/tools/harness-device.html
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const foundry = 'C:/Program Files/Foundry Virtual Tabletop/resources/app/public';
const foundryUrl = `file:///${foundry}/`;
const port = Number(process.env.PORT) || 8187;
const types = {
	'.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css',
	'.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
	'.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.woff': 'font/woff', '.otf': 'font/otf',
};

http.createServer((req, res) => {
	const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
	const [base, rest] = url.startsWith('/foundry/') ? [foundry, url.slice(9)] : [root, url.slice(1)];
	const file = path.resolve(base, rest || 'tools/harness-device.html');
	if (!file.startsWith(path.resolve(base))) return res.writeHead(403).end();
	fs.readFile(file, (err, data) => {
		if (err) return res.writeHead(404).end();
		const type = types[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
		res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
		res.end(type === 'text/html' ? data.toString('utf8').replaceAll(foundryUrl, '/foundry/') : data);
	});
}).listen(port, () => console.log(`harness at http://localhost:${port}/tools/harness-device.html`));
