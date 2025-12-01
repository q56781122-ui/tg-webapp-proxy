export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  try {
    let url = req.url.split("?url=")[1];
    if (!url) return new Response("Missing ?url", { status: 400 });

    url = decodeURIComponent(url);

    // 🔥 反代 WS（登录关键）
    if (url.startsWith("wss://") || url.startsWith("ws://")) {
      return Response.redirect(url, 101);
    }

    let realReq = new Request(url, {
      method: req.method,
      headers: {
        "Referer": "https://appcfp.wpoker.io/",
        "Origin": "https://appcfp.wpoker.io",
        "User-Agent": 
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1"
      },
      body: req.body
    });

    let res = await fetch(realReq);
    let contentType = res.headers.get("Content-Type") || "";

    // 🔥 HTML 内容 → 重写链接 + 去 CSP 才能运行 JS
    if (contentType.includes("text/html")) {
      let text = await res.text();

      text = text.replace(/Content-Security-Policy/gi, "");
      text = text.replace(/X-Frame-Options/gi, "");

      // 自动重写所有资源为代理路径
      text = text.replace(/https:\/\/appcfp\.wpoker\.io\//g,
        `https://${req.headers.get("host")}/api/proxy?url=https://appcfp.wpoker.io/`);

      return new Response(text, {
        headers: { "Content-Type": "text/html" }
      });
    }

    // 其他文件（JS/CSS/图像/Websocket握手）直接透传
    return new Response(res.body, { headers: { "Content-Type": contentType } });

  } catch (err) {
    return new Response("Proxy Error: " + err.toString());
  }
}
