const express = require('express');
const { getSubtitles } = require('youtube-captions-scraper');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// 프론트엔드 파일들이 들어갈 폴더 설정
const clientPath = path.join(__dirname, 'client');
app.use(express.static(clientPath));

// 자막 추출 API
app.get('/api/captions', async (req, res) => {
  const videoId = req.query.v;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  console.log(`Fetching captions for: ${videoId}`);

  try {
    // 1. 먼저 영어 자막('en') 시도
    let captions;
    try {
      captions = await getSubtitles({ videoID: videoId, lang: 'en' });
    } catch (e) {
      // 2. 실패 시 다른 시도 (유튜브 자동 자막 등)
      console.log('Trying with default language...');
      captions = await getSubtitles({ videoID: videoId });
    }
    
    res.json(captions);
  } catch (error) {
    console.error('Error fetching captions:', error);
    res.status(500).json({ error: '자막을 가져오지 못했습니다. 이 영상에 자막 기능이 켜져 있는지 확인해 주세요.' });
  }
});

// 메인 페이지 서빙
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`나만의 섀도잉 앱이 시작되었습니다!`);
  console.log(`맥북에서 접속: http://localhost:${PORT}`);
});
