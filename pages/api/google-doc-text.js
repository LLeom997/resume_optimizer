function extractDocId(input) {
  if (!input) return null;
  const m = String(input).match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { url } = req.body || {};
    const docId = extractDocId(url);
    if (!docId) return res.status(400).json({ error: "Invalid Google Docs URL" });

    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    const r = await fetch(exportUrl, { redirect: "follow" });
    if (!r.ok) {
      if (r.status === 401 || r.status === 403 || r.status === 404) {
        return res.status(200).json({ access: "no_access", text: "" });
      }
      return res.status(500).json({ error: `Google Docs fetch failed (${r.status})` });
    }

    const text = await r.text();
    if (!text || !text.trim()) return res.status(200).json({ access: "no_access", text: "" });
    return res.status(200).json({ access: "ok", text });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Fetch failed" });
  }
};
