/* =========================================================
   Noerz Downloader — Backend Proxy for Vercel
   Endpoint: /api/proxy
   ========================================================= */

export default async function handler(req, res) {
  /* CORS headers */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  /* Preflight */
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: false,
      error: 'Method not allowed. Use POST.'
    });
  }
  
  try {
    const body = req.body || {};
    const { url, tiktokUrl, ...rest } = body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        status: false,
        error: 'Parameter "url" wajib diisi.'
      });
    }
    
    /* Bangun payload untuk API target */
    const targetPayload = { ...rest };
    if (tiktokUrl) targetPayload.url = tiktokUrl;
    
    /* Whitelist domain */
    const allowedHosts = [
      'api.alwayscodex.eu.cc'
    ];
    
    let targetHost;
    try {
      targetHost = new URL(url).host;
    } catch (e) {
      return res.status(400).json({
        status: false,
        error: 'URL tidak valid.'
      });
    }
    
    if (!allowedHosts.includes(targetHost)) {
      return res.status(403).json({
        status: false,
        error: 'Domain tidak diizinkan.'
      });
    }
    
    /* Forward request */
    const controller = new AbortController();
    const timeoutId = setTimeout(function() {
      controller.abort();
    }, 25000);
    
    let apiRes;
    try {
      apiRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(targetPayload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({
          status: false,
          error: 'Request timeout.'
        });
      }
      return res.status(502).json({
        status: false,
        error: 'Gagal terhubung ke server target.'
      });
    }
    
    const text = await apiRes.text();
    res.status(apiRes.status);
    
    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch (e) {
      return res.send(text);
    }
    
  } catch (err) {
    return res.status(500).json({
      status: false,
      error: 'Terjadi kesalahan pada proxy server.',
      detail: err.message
    });
  }
}