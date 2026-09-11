import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { Mistral } from '@mistralai/mistralai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Support up to 50MB payload for audio chunks
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize Gemini client lazily/safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasMistralKey: !!process.env.MISTRAL_API_KEY,
    });
  });

  // Check available AI engines
  app.get('/api/ai-status', (req, res) => {
    res.json({
      gemini: !!process.env.GEMINI_API_KEY,
      mistral: !!process.env.MISTRAL_API_KEY,
    });
  });

  // Audio transcription endpoint with Mistral AI, Gemini API, and automatic failover
  app.post('/api/transcribe', async (req, res) => {
    try {
      const {
        audioBase64,
        mimeType = 'audio/wav',
        language = 'auto',
        engine = 'auto',
        videoDuration = 30,
      } = req.body;

      if (!audioBase64) {
        return res.status(400).json({ error: 'Missing audio data in request' });
      }

      // Handle sample video proxy without hitting quota
      if (audioBase64 === 'sample_audio_proxy') {
        return res.json({
          success: true,
          isSample: true,
          data: {
            segments: [
              {
                id: 'sample-1',
                start: 0.2,
                end: 2.2,
                text: 'VIRAL REEL CAPTION HOOK',
                words: [
                  { word: 'VIRAL', start: 0.2, end: 0.7 },
                  { word: 'REEL', start: 0.7, end: 1.3 },
                  { word: 'CAPTION', start: 1.3, end: 1.8 },
                  { word: 'HOOK', start: 1.8, end: 2.2 },
                ],
              },
              {
                id: 'sample-2',
                start: 2.4,
                end: 4.8,
                text: 'STOP SCROLLING AND WATCH THIS',
                words: [
                  { word: 'STOP', start: 2.4, end: 2.9 },
                  { word: 'SCROLLING', start: 2.9, end: 3.6 },
                  { word: 'AND', start: 3.6, end: 4.0 },
                  { word: 'WATCH THIS', start: 4.0, end: 4.8 },
                ],
              },
            ],
          },
        });
      }

      const hasMistral = !!process.env.MISTRAL_API_KEY;
      const hasGemini = !!process.env.GEMINI_API_KEY;

      // 1. If user specifically requested Mistral AI or if Mistral is available and preferred
      if (engine === 'mistral' || (engine === 'auto' && hasMistral && !hasGemini)) {
        if (!hasMistral) {
          return res.status(200).json({
            success: false,
            offlineFallback: true,
            error:
              'MISTRAL_API_KEY is not configured. Please add your Mistral API key in the AI Studio Settings menu to use Voxtral transcription.',
          });
        }

        try {
          const mistralResult = await transcribeWithMistral(audioBase64, mimeType, language, videoDuration);
          return res.json({
            success: true,
            engine: 'Mistral AI (Voxtral)',
            data: mistralResult,
          });
        } catch (mistralErr: any) {
          console.warn('Mistral AI transcription error:', mistralErr.message || mistralErr);
          // If auto mode and Gemini is available, try Gemini fallback
          if (engine === 'auto' && hasGemini) {
            console.log('Falling back from Mistral to Gemini...');
          } else {
            return res.status(200).json({
              success: false,
              offlineFallback: true,
              error: mistralErr.message || 'Mistral AI transcription encountered an error. Switched to offline captions.',
            });
          }
        }
      }

      // 2. Gemini API flow (or fallback from Mistral)
      if (hasGemini) {
        try {
          const ai = getGeminiClient();
          const systemPrompt = `You are a precision subtitle generator for viral vertical videos (YouTube Shorts, Instagram Reels, TikTok, Facebook Reels).
Transcribe the speech in this audio.
Requirements:
1. Accurately capture words in English, Hindi, Hinglish, or the spoken language.
2. Break speech into punchy, short subtitle segments (1 to 4 words or 1-2 seconds per segment) exactly like CapCut or Alex Hormozi style vertical captions.
3. For every segment, provide start and end timestamps in seconds (float).
4. For every word within a segment, provide word-level start and end timestamps in seconds.
5. Max duration is approximately ${videoDuration} seconds.

Return strictly valid JSON with this schema:
{
  "language": "detected language",
  "segments": [
    {
      "id": "string",
      "start": number,
      "end": number,
      "text": "UPPERCASE or natural text",
      "words": [
        {
          "word": "string",
          "start": number,
          "end": number
        }
      ]
    }
  ]
}`;

          const candidateModels = ['gemini-3.5-transcribe', 'gemini-3.8-flash', 'gemini-flash-latest'];
          let lastError: any = null;
          let parsedData: any = null;

          for (const modelName of candidateModels) {
            try {
              const response = await ai.models.generateContent({
                model: modelName,
                contents: [
                  {
                    inlineData: {
                      data: audioBase64,
                      mimeType: mimeType,
                    },
                  },
                  {
                    text: systemPrompt,
                  },
                ],
                config: {
                  responseMimeType: 'application/json',
                  temperature: 0.2,
                },
              });

              const responseText = response.text || '{}';
              try {
                parsedData = JSON.parse(responseText);
              } catch {
                const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedData = JSON.parse(cleaned);
              }

              if (parsedData && parsedData.segments && parsedData.segments.length > 0) {
                break;
              }
            } catch (err: any) {
              console.warn(`Model ${modelName} failed, trying next:`, err?.message || err);
              lastError = err;
              await new Promise((r) => setTimeout(r, 600));
            }
          }

          if (parsedData && parsedData.segments && parsedData.segments.length > 0) {
            return res.json({
              success: true,
              engine: 'Google Gemini',
              data: parsedData,
            });
          }

          // If Gemini experienced 503 and Mistral is configured, try Mistral
          if (hasMistral && !lastError?.message?.includes('API_KEY')) {
            try {
              const mistralResult = await transcribeWithMistral(audioBase64, mimeType, language, videoDuration);
              return res.json({
                success: true,
                engine: 'Mistral AI (Voxtral)',
                data: mistralResult,
              });
            } catch {}
          }

          const isUnavailable =
            lastError?.status === 503 ||
            lastError?.code === 503 ||
            lastError?.message?.includes('high demand') ||
            lastError?.message?.includes('UNAVAILABLE');

          return res.status(200).json({
            success: false,
            isHighDemand: isUnavailable,
            error: isUnavailable
              ? 'The AI transcription model is currently experiencing high demand. We have activated offline smart captions so you can keep editing immediately! You can retry AI transcription anytime.'
              : (lastError?.message || 'Unable to complete AI transcription at this time.'),
          });
        } catch (geminiErr: any) {
          console.error('Gemini error:', geminiErr);
        }
      }

      // If neither key is configured
      return res.status(200).json({
        success: false,
        offlineFallback: true,
        error:
          'No AI transcription API key is configured. You can use Mistral AI by setting MISTRAL_API_KEY or Gemini by setting GEMINI_API_KEY in the AI Studio Settings menu. Offline smart captions are active so your editing is uninterrupted!',
      });
    } catch (err: any) {
      console.error('Transcription route error:', err);
      res.status(200).json({
        success: false,
        error: err.message || 'Error processing transcription',
      });
    }
  });

  // Helper function: Transcribe using Mistral AI Voxtral API
  async function transcribeWithMistral(
    audioBase64: string,
    mimeType: string,
    language: string,
    videoDuration: number
  ) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error(
        'MISTRAL_API_KEY is not configured. Please add your Mistral API key in the AI Studio Settings menu.'
      );
    }

    const mistral = new Mistral({ apiKey });
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const uint8Array = new Uint8Array(audioBuffer);

    // Try models: 'voxtral-mini-latest', then 'voxtral-mini-2602'
    const modelsToTry = ['voxtral-mini-latest', 'voxtral-mini-2602'];
    let lastMistralErr: any = null;
    let result: any = null;

    for (const model of modelsToTry) {
      // 1. Try with segment timestamps
      try {
        result = await mistral.audio.transcriptions.complete({
          model,
          file: {
            fileName: 'audio.wav',
            content: uint8Array,
          },
          timestampGranularities: ['segment'],
        });
        if (result && (result.text || (result.segments && result.segments.length > 0))) {
          break;
        }
      } catch (err1: any) {
        lastMistralErr = err1;
        console.warn(`Mistral model ${model} with timestampGranularities failed:`, err1?.message || err1);

        // 2. If timestampGranularities was rejected by model, try simple transcription
        try {
          result = await mistral.audio.transcriptions.complete({
            model,
            file: {
              fileName: 'audio.wav',
              content: uint8Array,
            },
          });
          if (result && result.text) {
            break;
          }
        } catch (err2: any) {
          lastMistralErr = err2;
          console.warn(`Mistral model ${model} plain transcription failed:`, err2?.message || err2);
        }
      }
    }

    if (!result) {
      let detailedMsg = 'Mistral API transcription failed';
      if (lastMistralErr) {
        if (lastMistralErr.body) {
          try {
            const bodyObj = typeof lastMistralErr.body === 'string' ? JSON.parse(lastMistralErr.body) : lastMistralErr.body;
            if (bodyObj.detail) {
              detailedMsg = typeof bodyObj.detail === 'string' ? bodyObj.detail : JSON.stringify(bodyObj.detail);
            } else if (bodyObj.message) {
              detailedMsg = typeof bodyObj.message === 'string' ? bodyObj.message : JSON.stringify(bodyObj.message);
            } else {
              detailedMsg = JSON.stringify(bodyObj);
            }
          } catch {
            detailedMsg = String(lastMistralErr.body);
          }
        } else if (typeof lastMistralErr.message === 'string') {
          detailedMsg = lastMistralErr.message;
        }
      }
      throw new Error(`Mistral API Error: ${detailedMsg}`);
    }
    const rawSegments = result.segments || [];
    const rawWords = result.words || [];

    let segments: any[] = [];

    if (rawSegments.length > 0) {
      segments = rawSegments.map((seg: any, idx: number) => {
        let words = (seg.words || []).length > 0
          ? seg.words
          : rawWords.filter(
              (w: any) => w.start >= seg.start - 0.1 && w.end <= seg.end + 0.1
            );

        if (words.length === 0 && seg.text) {
          const split = seg.text.trim().split(/\s+/).filter(Boolean);
          const dur = Math.max(0.3, seg.end - seg.start);
          const step = dur / Math.max(1, split.length);
          words = split.map((w: string, i: number) => ({
            word: w,
            start: Number((seg.start + i * step).toFixed(2)),
            end: Number((seg.start + (i + 1) * step).toFixed(2)),
          }));
        }

        return {
          id: `mistral-seg-${idx + 1}`,
          start: Number(seg.start.toFixed(2)),
          end: Number(seg.end.toFixed(2)),
          text: seg.text?.trim() || '',
          words: words.map((w: any) => ({
            word: (w.word || '').trim(),
            start: Number(w.start.toFixed(2)),
            end: Number(w.end.toFixed(2)),
          })),
        };
      });
    } else if (rawWords.length > 0) {
      const wordsPerSeg = 3;
      for (let i = 0; i < rawWords.length; i += wordsPerSeg) {
        const chunk = rawWords.slice(i, i + wordsPerSeg);
        const start = Number(chunk[0].start.toFixed(2));
        const end = Number(chunk[chunk.length - 1].end.toFixed(2));
        segments.push({
          id: `mistral-seg-${Math.floor(i / wordsPerSeg) + 1}`,
          start,
          end,
          text: chunk.map((w: any) => w.word).join(' '),
          words: chunk.map((w: any) => ({
            word: (w.word || '').trim(),
            start: Number(w.start.toFixed(2)),
            end: Number(w.end.toFixed(2)),
          })),
        });
      }
    } else if (result.text) {
      const split = result.text.trim().split(/\s+/).filter(Boolean);
      const dur = videoDuration || 10;
      const step = dur / Math.max(1, split.length);
      const wordsWithTiming = split.map((w: string, i: number) => ({
        word: w,
        start: Number((i * step).toFixed(2)),
        end: Number(((i + 1) * step).toFixed(2)),
      }));
      const wordsPerSeg = 3;
      for (let i = 0; i < wordsWithTiming.length; i += wordsPerSeg) {
        const chunk = wordsWithTiming.slice(i, i + wordsPerSeg);
        segments.push({
          id: `mistral-seg-${Math.floor(i / wordsPerSeg) + 1}`,
          start: chunk[0].start,
          end: chunk[chunk.length - 1].end,
          text: chunk.map((w) => w.word).join(' '),
          words: chunk,
        });
      }
    }

    return {
      language: result.language || language || 'auto',
      segments,
      engine: 'Mistral AI (Voxtral)',
    };
  }

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoCaption Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
