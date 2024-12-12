// 바이낸스 API의 기본 주소와 웹소켓 주소 설정
const API_BASE_URL = 'https://fapi.binance.com/fapi/v1'; // 바이낸스 선물 거래소 API의 기본 URL
const WS_BASE_URL = 'wss://fstream.binance.com/ws'; // 바이낸스 선물 거래소 웹소켓 URL

let selectedCoins = []; // 선택된 코인 목록을 저장하는 배열
let ws; // 웹소켓 연결을 저장하는 변수

// 마지막으로 받은 가격 데이터를 저장하는 객체
let lastKnownPrices = {}; // { symbol: price }

// 선물 거래 가능한 코인 목록을 가져오는 함수
async function fetchFuturesCoinList() {
    try {
        const response = await fetch(`${API_BASE_URL}/exchangeInfo`); // API에 코인 목록 요청
        if (!response.ok) throw new Error('Failed to fetch futures coin list'); // 응답이 정상이 아니면 에러 발생
        const data = await response.json(); // 응답 데이터를 JSON으로 변환
        return data.symbols.filter(symbol => symbol.status === 'TRADING').map(symbol => ({ // 거래 가능한 코인만 필터링하고 필요한 정보만 추출하여 반환
            symbol: symbol.symbol,
            baseAsset: symbol.baseAsset
        }));
    } catch (error) {
        console.error('Error fetching futures coin list:', error); // 에러 발생 시 콘솔에 에러 출력
        return []; // 빈 배열 반환
    }
}

// 선택된 코인 목록을 저장하는 함수
function saveSelectedCoins() {
    chrome.storage.sync.set({ selectedCoins }, () => { // Chrome 스토리지에 선택된 코인 목록 저장
        console.log('Selected coins saved:', selectedCoins); // 저장 완료 후 콘솔에 로그 출력
    });
}

// 마지막으로 받은 가격을 localStorage에 저장하는 함수
function saveLastKnownPrices() {
    localStorage.setItem('lastKnownPrices', JSON.stringify(lastKnownPrices)); // 객체를 문자열로 변환하여 localStorage에 저장
}

// localStorage에서 마지막으로 받은 가격을 불러오는 함수
function loadLastKnownPrices() {
    const storedPrices = localStorage.getItem('lastKnownPrices'); // localStorage에서 데이터 가져오기
    if (storedPrices) {
        lastKnownPrices = JSON.parse(storedPrices); // 문자열 데이터를 객체로 변환하여 저장
    }
}

// 저장된 코인 목록을 불러오는 함수
function loadSelectedCoins() {
    chrome.storage.sync.get(['selectedCoins'], (result) => { // Chrome 스토리지에서 선택된 코인 목록 불러오기
        if (result.selectedCoins) {
            selectedCoins = result.selectedCoins; // 불러온 코인 목록을 변수에 저장
            updateSelectedCoins(); // 불러온 후 UI 업데이트
            displayLastKnownPrices(); // 마지막으로 받은 가격 표시
            subscribeToWebSocket(); // 웹소켓 구독도 업데이트
        }
    });
}

// 선택된 코인 목록 UI 업데이트 함수
function updateSelectedCoins() {
    const selectedCoinsDiv = document.getElementById('selectedCoins'); // 선택된 코인을 표시할 요소 가져오기
    selectedCoinsDiv.innerHTML = ''; // 기존 목록 초기화

    selectedCoins.forEach(symbol => {
        const span = document.createElement('span'); // 새로운 span 요소 생성
        span.textContent = symbol; // 코인 심볼 텍스트 설정
        span.classList.add('selected-coin'); // CSS 클래스 추가
        
        // 선택된 코인을 클릭하면 제거되도록 설정
        span.addEventListener('click', () => {
            selectedCoins = selectedCoins.filter(s => s !== symbol); // 클릭된 코인 제거
            updateSelectedCoins(); // UI 업데이트
            saveSelectedCoins(); // 저장 갱신
            subscribeToWebSocket(); // 웹소켓 구독 갱신
            removePriceFromUI(symbol); // 가격 목록에서 제거
        });
        selectedCoinsDiv.appendChild(span); // 선택된 코인 목록에 추가
    });
}

// 특정 코인의 가격 정보를 UI에서 제거하는 함수
function removePriceFromUI(symbol) {
    const pricesDiv = document.getElementById('prices'); // 가격 정보를 표시하는 요소 가져오기
    const priceItem = pricesDiv.querySelector(`[data-symbol="${symbol}"]`); // 해당 심볼의 가격 요소 찾기
    if (priceItem) pricesDiv.removeChild(priceItem); // 요소가 존재하면 제거

    delete lastKnownPrices[symbol]; // 마지막 가격에서도 제거하고 저장 갱신
    saveLastKnownPrices();
}

// 마지막으로 받은 가격을 화면에 표시하는 함수
function displayLastKnownPrices() {
    const pricesDiv = document.getElementById('prices'); // 가격 정보를 표시할 요소 가져오기

    Object.keys(lastKnownPrices).forEach(symbol => { 
        const priceItem = document.createElement('div'); 
        priceItem.setAttribute('data-symbol', symbol);
        priceItem.classList.add('price-item');
        
        priceItem.innerHTML = `
          <span class="coin-name">${symbol}</span>
          <span class="price">$${lastKnownPrices[symbol].toFixed(2)}</span>
          <span class="percent">-</span>
        `; 

        pricesDiv.appendChild(priceItem); 
    });
}

// 웹소켓 연결 및 구독 관리 함수
function subscribeToWebSocket() {
    if (ws) ws.close(); 

    ws = new WebSocket(WS_BASE_URL);

    ws.onopen = () => {
        console.log('WebSocket connected');
        
        const subscribeMsg = {
            method: 'SUBSCRIBE',
            params: selectedCoins.map(symbol => `${symbol.toLowerCase()}@ticker`),
            id: 1,
        };
        
        ws.send(JSON.stringify(subscribeMsg));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.e === '24hrTicker') { 
            updatePrice(data);
        }
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);

    ws.onclose = () => console.log('WebSocket disconnected');
}

// 실시간 가격 정보를 UI에 업데이트하는 함수
function updatePrice(data) {
    const pricesDiv = document.getElementById('prices'); // 가격 정보를 표시할 요소 가져오기
    const currentPrice = parseFloat(data.c); // 현재 가격
    const previousPrice = lastKnownPrices[data.s] || currentPrice; // 이전 가격 (없으면 현재 가격 사용)

    let priceItem = pricesDiv.querySelector(`[data-symbol="${data.s}"]`); // 해당 심볼의 가격 요소 찾기
    
    if (!priceItem) { // 가격 요소가 없으면 새로 생성
        priceItem = document.createElement('div'); 
        priceItem.setAttribute('data-symbol', data.s); 
        priceItem.classList.add('price-item');
        pricesDiv.appendChild(priceItem);
    }

    // 가격 변화에 따른 색상 결정
    let priceColor = 'black'; // 기본 색상 (변화 없음)
    if (currentPrice > previousPrice) {
        priceColor = 'green'; // 가격이 올랐을 때 녹색
    } else if (currentPrice < previousPrice) {
        priceColor = 'red'; // 가격이 내렸을 때 빨간색
    }

    // 마지막으로 받은 가격을 저장
    lastKnownPrices[data.s] = currentPrice; 
    saveLastKnownPrices(); // localStorage에 저장

    // HTML 업데이트: 이름, 가격, 등락 퍼센트 표시
    priceItem.innerHTML = `
      <span class="coin-name">${data.s}</span>
      <span class="price" style="color: ${priceColor};">$${currentPrice.toFixed(2)}</span>
      <span class="percent" style="color:${parseFloat(data.P) >= 0 ? 'green' : 'red'};">${parseFloat(data.P).toFixed(2)}%</span>
    `;

    // 가격 변화 효과 추가 (깜빡임)
    priceItem.classList.add('price-changed');
    setTimeout(() => priceItem.classList.remove('price-changed'), 1000); // 1초 후 깜빡임 효과 제거
}

// 코인 선택 기능 설정 함수
function setupCoinSelection(coins) {
    const searchInput = document.getElementById('searchInput'); // 검색 입력 필드 요소 가져오기
    const coinList = document.getElementById('coinList'); // 코인 목록을 표시할 요소 가져오기

    // 검색창 입력 이벤트 처리
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase(); // 입력된 검색어를 소문자로 변환

        // 검색창이 비어있으면 목록 초기화
        if (searchTerm === '') {
            coinList.innerHTML = ''; // 코인 목록 비우기
            return;
        }

        // 검색어와 일치하는 코인 필터링
        const filteredCoins = coins.filter(coin => 
            coin.symbol.toLowerCase().includes(searchTerm) || 
            coin.baseAsset.toLowerCase().includes(searchTerm)
        );

        // 필터링 결과를 화면에 표시
        coinList.innerHTML = ''; // 기존 목록 초기화
        filteredCoins.slice(0, 10).forEach(coin => { // 최대 10개의 결과만 표시
            const li = document.createElement('li'); // 새로운 리스트 아이템 생성
            li.textContent = `${coin.baseAsset} (${coin.symbol})`; // 코인 정보 텍스트 설정
            
            li.addEventListener('click', () => { // 클릭 이벤트 리스너 추가
                if (!selectedCoins.includes(coin.symbol)) { // 선택된 코인 목록에 없는 경우만 추가
                    selectedCoins.push(coin.symbol); // 선택된 코인 목록에 추가
                    updateSelectedCoins(); // UI 업데이트
                    saveSelectedCoins(); // 저장
                    subscribeToWebSocket(); // 웹소켓 구독 갱신
                }
            });
            coinList.appendChild(li); // 목록에 아이템 추가
        });
    });

    // 클릭 이벤트 리스너 추가: 문서 전체에 대해 클릭 이벤트 처리
    document.addEventListener('click', (event) => {
        const isClickInsideInput = searchInput.contains(event.target);
        const isClickInsideList = coinList.contains(event.target);

        if (!isClickInsideInput && !isClickInsideList) {
            coinList.innerHTML = ''; // 검색 목록 비우기
        }
    });
}


// 초기화 함수 정의 및 실행
async function init() {
    loadLastKnownPrices(); 
    const coins = await fetchFuturesCoinList(); 
    setupCoinSelection(coins);
    loadSelectedCoins();
}

document.addEventListener('DOMContentLoaded', init);