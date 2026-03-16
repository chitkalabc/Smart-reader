export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, max_tokens } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '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',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 1000,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || `API error ${response.status}`;
      console.error('Anthropic API error:', msg);
      return res.status(response.status).json({ error: msg });
    }

    const data = await response.json();
    const text = (data.content || []).map(b => b.text || '').join('');
    return res.status(200).json({ text });

  } catch (err) {
    console.error('Handler error:', err.message);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
