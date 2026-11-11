export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const url = new URL(request.url);
    const cipherText = url.searchParams.get("c");
    const ivBase64 = url.searchParams.get("iv");
    const AES_KEY = "MySuperSecretKey_32Characters!!";

    if (!cipherText || !ivBase64) {
      return new Response("Missing parameters", { status: 400, headers: corsHeaders });
    }

    try {
      const enc = new TextEncoder();
      const keyBuffer = await crypto.subtle.digest("SHA-256", enc.encode(AES_KEY));
      const cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-CBC" }, false, ["decrypt"]);
      const cipherBuffer = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
      const ivBuffer = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

      const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-CBC", iv: ivBuffer }, cryptoKey, cipherBuffer);
      const targetUrl = new TextDecoder().decode(decryptedBuffer);

      const response = await fetch(targetUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" }
      });
      const html = await response.text();

      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" }
      });
    } catch (e) {
      return new Response("Error: " + e.message, { status: 500, headers: corsHeaders });
    }
  }
};