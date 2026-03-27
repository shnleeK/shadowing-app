let player;
let captions = [];
let currentIndex = -1;
let isRepeating = false;
let trackerInterval;

// 유튜브 URL에서 ID 추출 함수
function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// YouTube IFrame API 초기화
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: '',
        playerVars: {
            'playsinline': 1,
            'controls': 1
        },
        events: {
            'onStateChange': onPlayerStateChange,
            'onError': (e) => console.error('Player error:', e)
        }
    });
}

// 재생 중인 자막 추적
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

// 현재 시간에 맞는 자막 하이라이트
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

    // 한 문장 반복 모드 체크
    if (isRepeating && currentIndex !== -1) {
        const currentCap = captions[currentIndex];
        const endTime = parseFloat(currentCap.start) + parseFloat(currentCap.dur);
        if (time >= endTime) {
            player.seekTo(parseFloat(currentCap.start));
        }
    }
}

// 자막 목록 렌더링
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
    if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// 불러오기 버튼 클릭 이벤트
document.getElementById('loadBtn').onclick = async () => {
    const url = document.getElementById('youtubeUrl').value;
    const videoId = getYouTubeId(url);
    
    if (!videoId) {
        alert('올바른 유튜브 주소를 입력해주세요.');
        return;
    }

    const loadBtn = document.getElementById('loadBtn');
    loadBtn.innerText = '로딩 중...';
    loadBtn.disabled = true;

    try {
        // 비디오 로드
        player.loadVideoById(videoId);

        // 자막 가져오기
        const response = await fetch(`/api/captions?v=${videoId}`);
        const data = await response.json();
        
        if (data.error) {
            alert(`${data.error}: ${data.message || '자막이 없거나 서버에서 차단되었습니다.'}`);
            captions = [];
            renderCaptions();
        } else {
            captions = data;
            currentIndex = -1;
            renderCaptions();
        }
    } catch (err) {
        alert('서버와 통신 중 오류가 발생했습니다.');
        captions = [];
        renderCaptions();
    } finally {
        loadBtn.innerText = '불러오기';
        loadBtn.disabled = false;
    }
};

// 컨트롤 버튼 이벤트
document.getElementById('repeatBtn').onclick = () => {
    isRepeating = !isRepeating;
    const btn = document.getElementById('repeatBtn');
    btn.innerText = isRepeating ? '반복 중 (ON)' : '현재 문장 반복 (A-B)';
    btn.style.backgroundColor = isRepeating ? '#ff3b30' : '#007aff';
};

document.getElementById('prevBtn').onclick = () => {
    if (currentIndex > 0) {
        player.seekTo(parseFloat(captions[currentIndex-1].start));
    }
};

document.getElementById('nextBtn').onclick = () => {
    if (currentIndex < captions.length - 1) {
        player.seekTo(parseFloat(captions[currentIndex+1].start));
    }
};
