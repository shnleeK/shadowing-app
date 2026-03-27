let player;
let captions = [];
let currentIndex = -1;
let isRepeating = false;
let trackerInterval;

function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: '',
        playerVars: { 'playsinline': 1, 'controls': 1 },
        events: {
            'onStateChange': onPlayerStateChange,
            'onError': (e) => console.error('Player error:', e)
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        if (!trackerInterval) {
            trackerInterval = setInterval(() => {
                const currentTime = player.getCurrentTime();
                updateActiveCaption(currentTime);
            }, 300);
        }
    } else {
        clearInterval(trackerInterval);
        trackerInterval = null;
    }
}

function updateActiveCaption(time) {
    if (captions.length === 0) return;

    const newIndex = captions.findIndex((c, i) => {
        const nextTime = captions[i+1] ? parseFloat(captions[i+1].start) : 999999;
        return time >= parseFloat(c.start) && time < nextTime;
    });

    if (newIndex !== -1 && newIndex !== currentIndex) {
        currentIndex = newIndex;
        renderCaptions();
        scrollToActive();
    }

    if (isRepeating && currentIndex !== -1) {
        const currentCap = captions[currentIndex];
        const endTime = parseFloat(currentCap.start) + parseFloat(currentCap.dur);
        if (time >= endTime) { player.seekTo(parseFloat(currentCap.start)); }
    }
}

function renderCaptions() {
    const list = document.getElementById('captionList');
    list.innerHTML = '';
    
    captions.forEach((c, index) => {
        const item = document.createElement('div');
        item.className = `caption-item ${index === currentIndex ? 'active' : ''}`;
        item.innerText = c.text;
        item.onclick = () => {
            player.seekTo(parseFloat(c.start));
            player.playVideo();
        };
        list.appendChild(item);
    });
}

function scrollToActive() {
    const activeItem = document.querySelector('.caption-item.active');
    if (activeItem) { activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}

// 영상 불러오기
document.getElementById('loadBtn').onclick = async () => {
    const url = document.getElementById('youtubeUrl').value;
    const videoId = getYouTubeId(url);
    if (!videoId) { alert('유튜브 주소를 입력하세요.'); return; }

    const loadBtn = document.getElementById('loadBtn');
    loadBtn.innerText = '로딩 중...';
    loadBtn.disabled = true;

    try {
        player.loadVideoById(videoId);
        const response = await fetch(`/api/captions?v=${videoId}`);
        const data = await response.json();
        
        if (data.error) {
            alert(`자동 로드 실패: ${data.message}`);
            captions = [];
        } else {
            captions = data;
            currentIndex = -1;
        }
    } catch (err) {
        alert('서버 응답 오류가 발생했습니다.');
        captions = [];
    } finally {
        renderCaptions();
        loadBtn.innerText = '불러오기';
        loadBtn.disabled = false;
    }
};

// 수동 입력 기능
document.getElementById('manualBtn').onclick = () => {
    const area = document.getElementById('manualInputArea');
    area.style.display = area.style.display === 'none' ? 'block' : 'none';
};

document.getElementById('applyManualBtn').onclick = () => {
    const text = document.getElementById('manualText').value;
    try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
            captions = data;
            currentIndex = -1;
            renderCaptions();
            alert('자막이 수동으로 적용되었습니다!');
            document.getElementById('manualInputArea').style.display = 'none';
        }
    } catch (e) {
        alert('JSON 형식이 올바르지 않습니다. 자막 데이터를 정확히 붙여넣어 주세요.');
    }
};

document.getElementById('repeatBtn').onclick = () => {
    isRepeating = !isRepeating;
    const btn = document.getElementById('repeatBtn');
    btn.innerText = isRepeating ? '반복 중 (ON)' : '현재 문장 반복 (A-B)';
    btn.style.backgroundColor = isRepeating ? '#ff3b30' : '#007aff';
};

document.getElementById('prevBtn').onclick = () => { if (currentIndex > 0) player.seekTo(parseFloat(captions[currentIndex-1].start)); };
document.getElementById('nextBtn').onclick = () => { if (currentIndex < captions.length - 1) player.seekTo(parseFloat(captions[currentIndex+1].start)); };
