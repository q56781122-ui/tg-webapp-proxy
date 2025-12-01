export const config = {
  runtime: "edge" // 🚀 Edge 加速，否则加载会超时/空白
};

export default async (req) => {
  const { searchParams } = new URL(req.url);
  let url = searchParams.get("url");
  if (!url) return new Response("❌ Missing url", { status: 400 });

  url = decodeURIComponent(url);

  // 代理请求
  const response = await fetch(url, {
    headers: {
      "Referer": "https://appcfp.wpoker.io/",
      "Origin": "https://appcfp.wpoker.io",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
    },
    redirect: "follow"
  });

  let body = await response.text();

  // ███ 解锁关键点：去 CSP、去安全限制  ███
  body = body.replace(/Content-Security-Policy/gi, "");
  body = body.replace(/frame-ancestors[^;]+;?/gi, "");
  body = body.replace(/X-Frame-Options:[^\n]+/gi, "");

  // ███ 强制资源全部通过代理加载 ███
  const rewrite = (content) =>
    content
      .replace(/src="(https?:\/\/[^"]+)"/g, `src="/api/proxy?url=$1"`)
      .replace(/href="(https?:\/\/[^"]+)"/g, `href="/api/proxy?url=$1"`)
      .replace(/src="\/([^"]+)"/g, `src="/api/proxy?url=https://appcfp.wpoker.io/$1"`)
      .replace(/href="\/([^"]+)"/g, `href="/api/proxy?url=https://appcfp.wpoker.io/$1"`);

  body = rewrite(body);

  return new Response(body, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
};
