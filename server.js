import express from 'express';
import { YoutubeTranscript } from 'youtube-transcript';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
const clientPath = path.join(__dirname, 'client');
app.use(express.static(clientPath));

app.get('/api/captions', async (req, res) => {
  const videoId = req.query.v;
  if (!videoId) return res.status(400).json({ error: 'Video ID is required' });

  console.log(`Fetching captions for video: ${videoId}`);

  try {
    let transcripts;
    const langs = ['en', 'en-US', 'ko'];
    let success = false;

    for (const lang of langs) {
      try {
        transcripts = await YoutubeTranscript.fetchTranscript(videoId, { lang });
        if (transcripts) {
          success = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!success) {
      transcripts = await YoutubeTranscript.fetchTranscript(videoId);
    }
    
    const captions = transcripts.map(t => ({
      text: t.text,
      dur: (t.duration / 1000).toString(),
      start: (t.offset / 1000).toString()
    }));

    res.json(captions);
  } catch (error) {
    console.error('Error fetching captions:', error);
    res.status(500).json({ 
      error: '자막 로드 실패',
      message: error.message || '이 영상은 자막 데이터를 제공하지 않거나 서버가 차단되었습니다.'
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
});
