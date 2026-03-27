const express = require('express');
const cors = require('cors');
const path = require('path');
const { getSubtitles } = require('youtube-captions-scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
const clientPath = path.join(__dirname, 'client');
app.use(express.static(clientPath));

app.get('/api/captions', async (req, res) => {
  const videoId = req.query.v;
  if (!videoId) return res.status(400).json({ error: 'Video ID is required' });

  console.log(`Fetching captions for: ${videoId}`);

  try {
    // 1. 영어 자막 시도
    let captions;
    try {
      captions = await getSubtitles({ videoID: videoId, lang: 'en' });
    } catch (e) {
      console.log('Falling back to default language...');
      // 2. 다른 언어나 자동 생성 자막 시도
      captions = await getSubtitles({ videoID: videoId });
    }
    
    // 이 라이브러리는 이미 { text, dur, start } 형식을 사용하므로 그대로 전달
    res.json(captions);
  } catch (error) {
    console.error('Final Error fetching captions:', error);
    res.status(500).json({ 
      error: '자막 추출 불가능',
      message: '유튜브 차단으로 자동 추출이 막혔습니다. "수동 자막 입력" 기능을 사용해 보세요.' 
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Shadowing Server running on port ${PORT}`);
});
