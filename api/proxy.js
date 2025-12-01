export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing url");

  const target = decodeURIComponent(url);

  try {
    const response = await fetch(target, {
      method: "GET",
      redirect: "follow",        // ⬅ 跟随跳转 VERY IMPORTANT
      headers: {
        "Referer": "https://appcfp.wpoker.io/",
        "Origin": "https://appcfp.wpoker.io",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Cache-Control": "no-cache",
      }
    });

    let body = await response.text();

    // ⛔ 删除 CSP 头（不删无法加载脚本）
    res.removeHeader("Content-Security-Policy");
    res.setHeader("Content-Security-Policy", "");

    // 🔥 强制所有 JS / CSS / 图片走代理
    body = body.replace(/src=\"\//g, `src="/api/proxy?url=${target}`);
    body = body.replace(/href=\"\//g, `href="/api/proxy?url=${target}`);

    // 输出游戏内容
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    res.status(200).send(body);

  } catch (err) {
    res.status(500).send("Proxy Error => " + err.message);
  }
}
