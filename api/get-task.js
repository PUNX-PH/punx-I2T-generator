export default async function handler(req, res) {
  // Only GET allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { taskId, runpod_id } = req.query;
  if (!taskId || !runpod_id) {
    return res.status(400).json({ error: 'Missing taskId or runpod_id' });
  }

  try {
    const runpodRes = await fetch(`https://${runpod_id}-8188.proxy.runpod.net/history/${taskId}`, {
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

    const outputGif = entry?.outputs?.["80"]?.gifs?.[0];
    const filename = outputGif?.filename;
    let video_url = null;
    if (filename) {
    video_url = `https://${runpod_id}-8188.proxy.runpod.net/view?filename=output/${filename}`;
    }

    // Timestamps: status->messages arrays
    const statusMsgs = entry?.status?.messages || [];
    let timestamp_start = null, timestamp_success = null;
    for (const msg of statusMsgs) {
      if (msg[0] === "execution_start") timestamp_start = msg[1]?.timestamp;
      if (msg[0] === "execution_success") timestamp_success = msg[1]?.timestamp;
    }

    return res.status(200).json({
        task_id,
        prompt: promptText,
        filename,
        video_url,
        status: 'Complete',
        timestamp_start,
        timestamp_success
    });


  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}