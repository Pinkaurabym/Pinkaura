export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOW_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type,x-admin-key");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  // simple auth
  if ((req.headers["x-admin-key"] || "") !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  const { products, sha } = body || {};
  if (!Array.isArray(products) || !sha) return res.status(400).json({ error: "Missing products or sha" });

  const {
    GITHUB_TOKEN = process.env.GH_TOKEN,
    GH_OWNER, GH_REPO,
    GH_BRANCH = "main",
    PRODUCTS_PATH = "data/products.json"
  } = process.env;

  const content = Buffer.from(JSON.stringify(products, null, 2)).toString("base64");

  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(PRODUCTS_PATH)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "chore(admin): update products.json",
      content,
      sha,
      branch: GH_BRANCH
    })
  });

  if (!r.ok) {
    const t = await r.text();
    return res.status(r.status).json({ error: t });
  }
  const json = await r.json(); // returns new sha
  res.json({ ok: true, commit: json.commit?.sha });
}
