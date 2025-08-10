// Serverless function: decrements variant stock in data/products.json on GitHub
// Expects JSON body: { cart: [{ id, color, qty }] }

export default async function handler(req, res) {
  // --- CORS (allow your GH Pages domain) ---
  const ORIGIN = req.headers.origin || "";
  const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*"; // e.g., "https://<user>.github.io"
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      GITHUB_TOKEN,
      GH_OWNER,
      GH_REPO,
      GH_BRANCH = "main",
      PRODUCTS_PATH = "data/products.json"
    } = process.env;

    if (!GITHUB_TOKEN || !GH_OWNER || !GH_REPO) {
      return res.status(500).json({ error: "Missing required env vars" });
    }

    const { cart } = req.body || {};
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty or invalid" });
    }

    // 1) Get current products.json from GitHub
    const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(PRODUCTS_PATH)}?ref=${GH_BRANCH}`;
    const fileRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    });
    if (!fileRes.ok) {
      const txt = await fileRes.text();
      return res.status(fileRes.status).json({ error: `Read failed: ${txt}` });
    }
    const fileJson = await fileRes.json();
    const sha = fileJson.sha;
    const products = JSON.parse(Buffer.from(fileJson.content, "base64").toString("utf8"));

    // 2) Decrement stock per line
    for (const line of cart) {
      const p = products.find(x => Number(x.id) === Number(line.id));
      const v = p?.variants?.find(vr => (vr.color || "").toLowerCase() === (line.color || "").toLowerCase());
      if (!p || !v) {
        return res.status(400).json({ error: `Variant not found for id=${line.id}, color=${line.color}` });
      }
      const have = Number(v.stock || 0);
      const need = Number(line.qty || 0);
      if (!Number.isFinite(need) || need <= 0) {
        return res.status(400).json({ error: `Bad qty for id=${line.id}` });
      }
      if (need > have) {
        return res.status(409).json({ error: `Insufficient stock for ${p.name} (${v.color}). Have ${have}, need ${need}` });
      }
      v.stock = have - need;
    }

    // 3) Commit updated file back to GitHub
    const newContent = Buffer.from(JSON.stringify(products, null, 2)).toString("base64");
    const putRes = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(PRODUCTS_PATH)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "chore: decrement stock on checkout",
        content: newContent,
        sha,
        branch: GH_BRANCH
      })
    });
    if (!putRes.ok) {
      const txt = await putRes.text();
      return res.status(putRes.status).json({ error: `Write failed: ${txt}` });
    }

    // Return the new products so the client can refresh local cache immediately
    return res.json({ ok: true, productsUpdated: JSON.parse(Buffer.from(newContent, "base64").toString("utf8")) });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
