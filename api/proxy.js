export const config = { runtime: "edge" };

export default async (req) => {
  let url = req.url.split("?url=")[1];
  if (!url) return new Response("Invalid URL", { status: 400 });

  url = decodeURIComponent(url);

  // 关键：代理所有资源
  let response = await fetch(url, {
    headers: {
      "Referer": "https://appcfp.wpoker.io/",
      "Origin": "https://appcfp.wpoker.io",
      "User-Agent": 
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile Safari/604.1"
    }
  });

  let text = await response.text();

  // 移除 CSP & Frame Header
  text = text.replace(/Content-Security-Policy/gi, "");
  text = text.replace(/X-Frame-Options/gi, "");

  // 核心：全路径重写！
  text = text.replace(/https:\/\/appcfp\.wpoker\.io\//g,
    `https://${req.headers.get("host")}/proxy/`);

  return new Response(text, { headers: { "Content-Type": "text/html" } });
};
