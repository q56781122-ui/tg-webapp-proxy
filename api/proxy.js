export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  try {
    let url = req.url.split("?url=")[1];
    if (!url) return new Response("Missing ?url=...", { status: 400 });

    url = decodeURIComponent(url);

    // =============== WebSocket 直通（进入大厅关键） ===============
    if (url.startsWith("wss://") || url.startsWith("ws://")) {
      return fetch(url, {
        headers: {
          "Origin": "https://appcfp.wpoker.io",
          "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1"
        }
      });
    }

    // =============== 静态资源透传 ===============
    let real = new Request(url, {
      method: req.method,
      headers: {
        "Referer": "https://appcfp.wpoker.io/",
        "Origin": "https://appcfp.wpoker.io",
        "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1"
      },
      body: req.body
    });

    let res = await fetch(real);
    let type = res.headers.get("Content-Type") || "";


    // =============== HTML — 重点处理 ===============
    if (type.includes("text/html")) {
      let text = await res.text();

      // 移除 CSP / X-Frame 拦截
      text = text.replace(/Content-Security-Policy/gi, "");
      text = text.replace(/X-Frame-Options/gi, "");

      // 强制全屏适配
      text = text.replace("</head>", `
      <style>
      body,html {margin:0;padding:0;overflow:hidden;height:100vh;}
      iframe,canvas,div {max-width:100%;height:100vh!important;}
      </style>
      </head>`);

      // 🔥 重写所有 fetch/ws 指向 proxy 转发
      text = text.replace(/https:\/\/appcfp\.wpoker\.io/g,
      "https://" + req.headers.get("host") + "/api/proxy?url=https://appcfp.wpoker.io");

      return new Response(text, { headers: { "Content-Type": "text/html" } });
    }

    // =============== 其他类型(js/css/img)直接返回 ===============
    return new Response(res.body, { headers: { "Content-Type": type } });

  } catch (e) {
    return new Response(`Proxy Error → ${e}`, { status: 502 });
  }
}
