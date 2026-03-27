const express = require('express');
const { YoutubeTranscript } = require('youtube-transcript');
const cors = require('cors');
const path = require('path');

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
    // 여러 언어 시도 (en, en-US, ko 순서)
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
      // 마지막으로 언어 지정 없이 시도
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
    // 에러 메시지를 더 구체적으로 보냄
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
