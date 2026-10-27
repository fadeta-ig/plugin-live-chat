import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Local visual QA only. Chat responses are fixtures; no WordPress or AI requests.
const root = new URL('../', import.meta.url);
const port = Number(process.env.CHAT_PREVIEW_PORT || 4173);
const html = `<!doctype html><html lang="id"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shinyoung Chat — Local Preview</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600&display=swap">
<style>
body{margin:0;background:#eeece5;color:#2f3e34;font:15px/1.6 Manrope,sans-serif;min-height:100vh}
main{padding:48px;max-width:580px}main small{letter-spacing:.15em;font-size:11px}main h1{font:500 64px/1.1 'Cormorant Garamond',Georgia,serif;margin:24px 0}main p{max-width:350px;color:#62685f}
/* Representative host-theme rules must not erase the widget's own spacing. */
button{padding:18px 28px;background:#111;color:white;border-radius:30px;font:700 20px/1.2 Georgia;letter-spacing:.1em;text-transform:uppercase}
h2,h3,h4{margin:24px 0;color:#111;font:700 40px/1.1 Georgia}p{margin:0 0 24px}input[type=text]{padding:20px;border:2px solid #111;background:#ddd;width:100%;font-size:20px}svg{vertical-align:middle}
ul,ol{margin:24px 0;padding-left:40px;list-style-position:inside}li{margin-bottom:24px;padding-left:12px;line-height:2}
@media(max-width:640px){main{padding:24px}main h1{font-size:44px}}
</style><link rel="stylesheet" href="/assets/dist/widget.css">
</head><body><main><small>SHINYOUNG / LOCAL PREVIEW</small><h1>Care, thoughtfully<br>chosen.</h1><p>Preview tampilan widget. Pesan dan produk di sini adalah data contoh untuk pemeriksaan lokal.</p></main>
<div id="ai-woo-sa-widget-root"></div>
<script>window.aiWooSaConfig={restUrl:'/chat',nonce:'local-preview',botName:'Shinyoung Assistant',wcAjaxUrl:'/cart',waNumber:'',currentProduct:null,cartItems:[]};</script>
<script src="/assets/dist/widget.js"></script></body></html>`;

http.createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/chat' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text: 'Untuk rambut yang terasa kering, Anda dapat memadukan **Shampoo Anti Ketombe** dan **Hair Serum Anti Ketombe** sebagai langkah perawatan.\n\n- **Triple Ferment** menutrisi akar dan membantu merawat barrier kulit kepala.\n\n- **Pro-Vitamin B5** membantu menjaga kelembapan rambut.\n\n- **Panthenol** pada serum membantu melembapkan helai rambut yang kering.\n\nCeritakan kondisi rambut Anda agar kami dapat membantu memilih perawatan yang sesuai.' }));
        return;
    }
    if (path === '/' || path === '/preview') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(html);
        return;
    }
    if (['/assets/dist/widget.css', '/assets/dist/widget.js'].includes(path)) {
        try {
            const contents = await readFile(new URL(path.slice(1), root));
            res.writeHead(200, { 'Content-Type': path.endsWith('.css') ? 'text/css' : 'text/javascript', 'Cache-Control': 'no-store' });
            res.end(contents);
            return;
        } catch { /* Show a useful 404 before a build. */ }
    }
    res.writeHead(404);
    res.end('Not found. Run npm run build first.');
}).listen(port, '127.0.0.1', () => console.log('Local chat preview: http://127.0.0.1:' + port + ' (' + fileURLToPath(root) + ')'));
