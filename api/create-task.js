export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Receive user data
  const {
    prompt,          // string
    negative_prompt, // string
    input_image,     // string, image file name
    runpod_id,       // string (required)
    duration         // seconds, max 10
  } = req.body;

  // Validate required fields
  if (!prompt || !negative_prompt || !input_image || !runpod_id || duration === undefined) {
    res.status(400).json({ error: "Missing required params: prompt, negative_prompt, input_image, runpod_id, duration" });
    return;
  }

  // Duration validation
  const durationNum = Number(duration);
  if (isNaN(durationNum) || durationNum < 1 || durationNum > 10) {
    res.status(400).json({ error: "Invalid duration: must be a number between 1 and 10 (seconds)" });
    return;
  }

  // Calculate num_frames (comfyUI expects it as integer)
  const num_frames = Math.round(durationNum * 16.2); // 5s=81 frames → 16.2 FPS

  // Generate a random seed each call
  const randomSeed = Math.floor(Math.random() * 100000000);

  // Construct the payload, filling in prompt, negative_prompt, input_image, num_frames, seed
  const payload = {
    "prompt": {
      "80": {
        "inputs": {
          "frame_rate": 16,
          "loop_count": 0,
          "filename_prefix": "teacache",
          "format": "video/h264-mp4",
          "pix_fmt": "yuv420p",
          "crf": 19,
          "save_metadata": true,
          "trim_to_audio": false,
          "pingpong": false,
          "save_output": true,
          "images": [
            "204",
            0
          ]
        },
        "class_type": "VHS_VideoCombine",
        "_meta": { "title": "Video Combine 🎥🅥🅗🅢" }
      },
      "94": {
        "inputs": {
          "frame_rate": 60,
          "loop_count": 0,
          "filename_prefix": "Hunyuan/videos/30/vid",
          "format": "video/h264-mp4",
          "pix_fmt": "yuv420p",
          "crf": 19,
          "save_metadata": true,
          "trim_to_audio": false,
          "pingpong": false,
          "save_output": true,
          "images": [
            "270",
            0
          ]
        },
        "class_type": "VHS_VideoCombine",
        "_meta": { "title": "Video Combine 🎥🅥🅗🅢" }
      },
      "154": {
        "inputs": {
          "model_name": "4xLSDIR.pth"
        },
        "class_type": "UpscaleModelLoader",
        "_meta": { "title": "Upscaler" }
      },
      "155": {
        "inputs": {
          "UPSCALE_MODEL": [
            "154",
            0
          ]
        },
        "class_type": "Anything Everywhere",
        "_meta": { "title": "Anything Everywhere" }
      },
      "198": {
        "inputs": {
          "model": "wan2.1_i2v_480p_14B_bf16.safetensors",
          "base_precision": "bf16",
          "quantization": "fp8_e5m2",
          "load_device": "offload_device",
          "attention_mode": "sageattn",
          "lora": [
            "264",
            0
          ]
        },
        "class_type": "WanVideoModelLoader",
        "_meta": { "title": "WanVideo Model Loader" }
      },
      "202": {
        "inputs": {
          "model_name": "Wan2_1_VAE_bf16.safetensors",
          "precision": "bf16"
        },
        "class_type": "WanVideoVAELoader",
        "_meta": { "title": "WanVideo VAE Loader" }
      },
      "204": {
        "inputs": {
          "enable_vae_tiling": false,
          "tile_x": 272,
          "tile_y": 272,
          "tile_stride_x": 144,
          "tile_stride_y": 128,
          "normalization": "default",
          "vae": [
            "202",
            0
          ],
          "samples": [
            "205",
            0
          ]
        },
        "class_type": "WanVideoDecode",
        "_meta": { "title": "WanVideo Decode" }
      },
      "205": {
        "inputs": {
          "steps": 5,
          "cfg": 1.0000000000000002,
          "shift": 8.000000000000002,
          "seed": randomSeed, // random each call
          "force_offload": true,
          "scheduler": "unipc",
          "riflex_freq_index": 0,
          "denoise_strength": 1,
          "batched_cfg": "",
          "rope_function": "comfy",
          "start_step": 0,
          "end_step": -1,
          "model": [
            "198",
            0
          ],
          "image_embeds": [
            "215",
            0
          ],
          "text_embeds": [
            "269",
            0
          ],
          "feta_args": [
            "259",
            0
          ]
        },
        "class_type": "WanVideoSampler",
        "_meta": { "title": "WanVideo Sampler" }
      },
      "215": {
        "inputs": {
          "generation_width": 720,
          "generation_height": 1280,
          "num_frames": num_frames, // <--- set from duration param
          "force_offload": false,
          "noise_aug_strength": 0,
          "latent_strength": 1,
          "clip_embed_strength": 1,
          "adjust_resolution": true,
          "image": [
            "218",
            0
          ],
          "vae": [
            "202",
            0
          ],
          "clip_vision": [
            "272",
            0
          ]
        },
        "class_type": "WanVideoImageClipEncode",
        "_meta": { "title": "Video Size and Length - WanVideo ImageClip Encode" }
      },
      "218": {
        "inputs": {
          "image": input_image
        },
        "class_type": "LoadImage",
        "_meta": { "title": "Input Image" }
      },
      "257": {
        "inputs": {
          "CLIP_VISION": [
            "272",
            0
          ]
        },
        "class_type": "Anything Everywhere",
        "_meta": { "title": "Anything Everywhere" }
      },
      "259": {
        "inputs": {
          "weight": 2,
          "start_percent": 0,
          "end_percent": 1
        },
        "class_type": "WanVideoEnhanceAVideo",
        "_meta": { "title": "WanVideo Enhance-A-Video" }
      },
      "261": {
        "inputs": {
          "lora": "Wan21_T2V_14B_lightx2v_cfg_step_distill_lora_rank32.safetensors",
          "strength": 0.7000000000000002,
          "low_mem_load": false,
          "merge_loras": true
        },
        "class_type": "WanVideoLoraSelect",
        "_meta": { "title": "Self Forcing LoRA (Don't Change)" }
      },
      "262": {
        "inputs": {
          "lora": "Wan21_T2V_14B_lightx2v_cfg_step_distill_lora_rank32.safetensors",
          "strength": 0,
          "low_mem_load": false,
          "merge_loras": true,
          "prev_lora": [
            "261",
            0
          ]
        },
        "class_type": "WanVideoLoraSelect",
        "_meta": { "title": "LoRA 1" }
      },
      "263": {
        "inputs": {
          "lora": "Wan21_T2V_14B_lightx2v_cfg_step_distill_lora_rank32.safetensors",
          "strength": 0,
          "low_mem_load": false,
          "merge_loras": true,
          "prev_lora": [
            "262",
            0
          ]
        },
        "class_type": "WanVideoLoraSelect",
        "_meta": { "title": "LoRA 2" }
      },
      "264": {
        "inputs": {
          "lora": "Wan21_T2V_14B_lightx2v_cfg_step_distill_lora_rank32.safetensors",
          "strength": 0,
          "low_mem_load": false,
          "merge_loras": true,
          "prev_lora": [
            "263",
            0
          ]
        },
        "class_type": "WanVideoLoraSelect",
        "_meta": { "title": "LoRA 3" }
      },
      "265": {
        "inputs": {
          "text": prompt
        },
        "class_type": "Text Prompt (JPS)",
        "_meta": { "title": "Text Prompt (JPS)" }
      },
      "266": {
        "inputs": {
          "text": negative_prompt
        },
        "class_type": "Text Prompt (JPS)",
        "_meta": { "title": "Text Prompt (JPS)" }
      },
      "267": {
        "inputs": {
          "model_name": "umt5-xxl-enc-bf16.safetensors",
          "precision": "bf16",
          "load_device": "offload_device",
          "quantization": "fp8_e4m3fn"
        },
        "class_type": "LoadWanVideoT5TextEncoder",
        "_meta": { "title": "WanVideo T5 Text Encoder Loader" }
      },
      "269": {
        "inputs": {
          "positive_prompt": [
            "265",
            0
          ],
          "negative_prompt": [
            "266",
            0
          ],
          "force_offload": false,
          "use_disk_cache": false,
          "device": "gpu",
          "t5": [
            "267",
            0
          ]
        },
        "class_type": "WanVideoTextEncode",
        "_meta": { "title": "WanVideo TextEncode" }
      },
      "270": {
        "inputs": {
          "ckpt_name": "rife49.pth",
          "clear_cache_after_n_frames": 5,
          "multiplier": 4,
          "fast_mode": false,
          "ensemble": true,
          "scale_factor": 1,
          "frames": [
            "204",
            0
          ]
        },
        "class_type": "RIFE VFI",
        "_meta": { "title": "RIFE VFI (recommend rife47 and rife49)" }
      },
      "272": {
        "inputs": {
          "clip_name": "clip_vision_h.safetensors"
        },
        "class_type": "CLIPVisionLoader",
        "_meta": { "title": "Load CLIP Vision" }
      }
    }
  };

  // Send to Runpod
  try {
    const response = await fetch(`https://${runpod_id}-8188.proxy.runpod.net/prompt`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      res.status(response.status).json({ error });
      return;
    }
    const data = await response.json();
    res.status(200).json({
      task_id: data.prompt_id,
      seed: randomSeed,
      num_frames: num_frames,
      duration: durationNum
    });
  } catch (err) {
    res.status(500).json({ error: 'API call failed', message: err.message });
  }
}