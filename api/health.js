export default async function handler(req, res) {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  const keyPreview = hasKey
    ? process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...'
    : 'NOT SET';

  return res.status(200).json({
    status: 'ok',
    apiKeyConfigured: hasKey,
    keyPreview: keyPreview,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
}
