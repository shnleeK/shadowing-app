const express = require('express');
const { YoutubeTranscript } = require('youtube-transcript');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// 프론트엔드 파일들이 들어갈 폴더 설정
const clientPath = path.join(__dirname, 'client');
app.use(express.static(clientPath));

// 자막 추출 API (더 안정적인 youtube-transcript 사용)
app.get('/api/captions', async (req, res) => {
  const videoId = req.query.v;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  console.log(`Fetching captions for video: ${videoId}`);

  try {
    // 1. 영어 자막 시도
    let transcripts;
    try {
      transcripts = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    } catch (e) {
      console.log('English captions not found, trying without lang spec...');
      // 2. 다른 언어나 자동 생성 자막 시도
      transcripts = await YoutubeTranscript.fetchTranscript(videoId);
    }
    
    // 이 라이브러리는 { text, duration, offset } 형식을 돌려줍니다. 
    // 기존 script.js와 호환되게 { text, dur, start } 형식으로 변환합니다.
    const captions = transcripts.map(t => ({
      text: t.text,
      dur: (t.duration / 1000).toString(), // ms -> s
      start: (t.offset / 1000).toString()   // ms -> s
    }));

    res.json(captions);
  } catch (error) {
    console.error('Error in /api/captions:', error);
    res.status(500).json({ 
      error: '자막을 가져오지 못했습니다.',
      message: error.message || '이 영상에는 자막이 없는 것 같습니다.' 
    });
  }
});

// 메인 페이지 서빙
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
});
