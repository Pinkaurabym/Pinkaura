export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", process.env.ALLOW_ORIGIN || "*");
    setCORS(req, res);

    if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

    const {
        GITHUB_TOKEN = process.env.GH_TOKEN,
        GH_OWNER, GH_REPO,
        GH_BRANCH = "main",
        PRODUCTS_PATH = "data/products.json"
    } = process.env;

    const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(PRODUCTS_PATH)}?ref=${GH_BRANCH}`;
    const r = await fetch(url, {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }
    });

    if (!r.ok) {
        const t = await r.text();
        return res.status(r.status).json({ error: t });
    }

    const file = await r.json();
    const products = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
    res.json({ products, sha: file.sha });
}

function setCORS(req, res) {
    const list = (process.env.ALLOW_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    const origin = req.headers.origin || '';
    const allow = list.includes('*') || list.includes(origin);
    // tell caches this varies by Origin
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key');
    res.setHeader('Access-Control-Max-Age', '600');
    res.setHeader('Access-Control-Allow-Origin', allow ? origin : list[0] || '*');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

}
