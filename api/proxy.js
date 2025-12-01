export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("❌ Missing url parameter");

  const target = decodeURIComponent(url);

  const proxy = await fetch(target, {
    headers: {
      "Referer": "https://appcfp.wpoker.io/",
      "Origin": "https://appcfp.wpoker.io",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
    }
  });

  const type = proxy.headers.get("Content-Type") || "text/html";
  res.setHeader("Content-Type", type);

  const body = await proxy.text();
  res.status(proxy.status).send(body);
}
