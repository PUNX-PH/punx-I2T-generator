export default async function handler(req, res) {
  // Only GET allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { taskId, base_url } = req.query;
  if (!taskId || !base_url) {
    return res.status(400).json({ error: 'Missing taskId or base_url' });
  }

  try {
    const runpodRes = await fetch(`https://${base_url}-8188.proxy.runpod.net/history/${taskId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await runpodRes.json();

    // If empty object: Pending
    if (!data || Object.keys(data).length === 0) {
      return res.status(200).json({
        status: 'Pending'
      });
    }

    // Data is ready - extract as per your requirements
    const entry = data[taskId];

    // Prompt text: node 265
    const promptText = entry?.prompt?.[2]?.[2]?.["265"]?.inputs?.text;

    // Filename and path: outputs->80->gifs[0]
    const outputGif = entry?.outputs?.["80"]?.gifs?.[0];
    const filename = outputGif?.filename;
    const filepath = outputGif?.fullpath;

    // Timestamps: status->messages arrays
    const statusMsgs = entry?.status?.messages || [];
    let timestamp_start = null, timestamp_success = null;
    for (const msg of statusMsgs) {
      if (msg[0] === "execution_start") timestamp_start = msg[1]?.timestamp;
      if (msg[0] === "execution_success") timestamp_success = msg[1]?.timestamp;
    }

    return res.status(200).json({
      taskId,
      prompt: promptText,
      filename,
      filepath,
      status: 'Complete',
      timestamp_start,
      timestamp_success
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}