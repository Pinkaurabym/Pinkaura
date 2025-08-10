// /api/checkout.js
// Decrement variant stock in data/products.json on GitHub.
// Expects: POST { cart: [{ id, color, qty }] }

export default async function handler(req, res) {
  // --- CORS (set ALLOW_ORIGIN in Vercel env) ---
  const ORIGIN = req.headers.origin || "";
  const ALLOW = process.env.ALLOW_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", ALLOW);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  // Read env (support a few common names)
  const {
    GITHUB_TOKEN = process.env.GH_TOKEN,
    GH_OWNER = process.env.GITHUB_OWNER,
    GH_REPO = process.env.GITHUB_REPO,
    GH_BRANCH = process.env.GITHUB_BRANCH || "main",
    PRODUCTS_PATH = process.env.GH_FILE_PATH || "data/products.json",
  } = process.env;

  // Early validation
  const missing = [];
  if (!GITHUB_TOKEN) missing.push("GITHUB_TOKEN");
  if (!GH_OWNER) missing.push("GH_OWNER");
  if (!GH_REPO) missing.push("GH_REPO");
  if (missing.length) {
    console.error("Missing env vars:", missing);
    return res.status(500).json({ error: `Missing env vars: ${missing.join(", ")}` });
  }

  let payload;
  try {
    payload = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
  } catch (e) {
    console.error("Bad JSON body:", e?.message);
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const cart = Array.isArray(payload?.cart) ? payload.cart : null;
  if (!cart || cart.length === 0) {
    console.error("Empty or invalid cart:", payload);
    return res.status(400).json({ error: "Cart is empty or invalid" });
  }

  try {
    // 1) Read current products.json
    const readURL = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(PRODUCTS_PATH)}?ref=${GH_BRANCH}`;
    const readRes = await fetch(readURL, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      }
    });

    if (!readRes.ok) {
      const txt = await readRes.text();
      console.error("GitHub READ failed:", readRes.status, txt);
      return res.status(readRes.status).json({ error: `GitHub READ failed: ${txt}` });
    }

    const fileJson = await readRes.json();
    const sha = fileJson.sha;
    let products;
    try {
      products = JSON.parse(Buffer.from(fileJson.content, "base64").toString("utf8"));
    } catch (e) {
      console.error("products.json parse error:", e?.message);
      return res.status(500).json({ error: "products.json is not valid JSON" });
    }

    // 2) Decrement stock per cart line (variant-level)
    for (const line of cart) {
      const pid = Number(line.id);
      const color = String(line.color || "").toLowerCase();
      const need = Number(line.qty);

      if (!Number.isFinite(pid) || !color || !Number.isFinite(need) || need <= 0) {
        console.error("Bad line:", line);
        return res.status(400).json({ error: `Bad cart line: ${JSON.stringify(line)}` });
      }

      const p = products.find(x => Number(x.id) === pid);
      const v = p?.variants?.find(vr => String(vr.color || "").toLowerCase() === color);
      if (!p || !v) {
        console.error("Variant not found:", { pid, color });
        return res.status(400).json({ error: `Variant not found for id=${pid}, color=${line.color}` });
      }

      const have = Number(v.stock || 0);
      if (need > have) {
        console.error("Insufficient stock:", { pid, color, have, need });
        return res.status(409).json({ error: `Insufficient stock for ${p.name} (${v.color}). Have ${have}, need ${need}` });
      }
      v.stock = have - need;
    }

    // 3) Commit updated JSON back to GitHub
    const newContent = Buffer.from(JSON.stringify(products, null, 2)).toString("base64");
    const writeRes = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(PRODUCTS_PATH)}`, {
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

    if (!writeRes.ok) {
      const txt = await writeRes.text();
      console.error("GitHub WRITE failed:", writeRes.status, txt);
      return res.status(writeRes.status).json({ error: `GitHub WRITE failed: ${txt}` });
    }

    // Return updated products so client cache can refresh instantly
    const updated = JSON.parse(Buffer.from(newContent, "base64").toString("utf8"));
    return res.json({ ok: true, productsUpdated: updated });
  } catch (err) {
    console.error("Unhandled error in /api/checkout:", err);
    return res.status(500).json({ error: err?.message || "Internal Server Error" });
  }
}
