// WebSocket 연결을 위한 기본 URL을 상수로 정의합니다.
const WS_BASE_URL = 'wss://fstream.binance.com/ws';
// WebSocket 객체를 저장할 변수를 선언합니다.
let ws = null;

// WebSocket 연결 및 구독 관리 함수
export function subscribeToWebSocket(selectedCoins, onMessageCallback) {
    // 기존 WebSocket 연결이 있으면 닫습니다.
    if (ws) ws.close();

    // 새로운 WebSocket 연결을 생성합니다.
    ws = new WebSocket(WS_BASE_URL);

    // WebSocket이 연결되었을 때 실행되는 콜백 함수
    ws.onopen = () => {
        console.log('WebSocket connected');
        // 구독 메시지를 생성합니다.
        const subscribeMsg = {
            method: 'SUBSCRIBE',
            params: selectedCoins.map(symbol => `${symbol.toLowerCase()}@ticker`),
            id: 1,
        };
        // 구독 메시지를 WebSocket 서버로 전송합니다.
        ws.send(JSON.stringify(subscribeMsg));
    };

    // WebSocket 메시지를 받았을 때 실행되는 콜백 함수
    ws.onmessage = (event) => {
        // 받은 데이터를 JSON으로 파싱합니다.
        const data = JSON.parse(event.data);
        // 24시간 티커 이벤트인 경우 콜백 함수를 호출합니다.
        if (data.e === '24hrTicker') {
            onMessageCallback(data);
        }
    };

    // WebSocket 에러 발생 시 실행되는 콜백 함수
    ws.onerror = (error) => console.error('WebSocket error:', error);

    // WebSocket 연결이 닫혔을 때 실행되는 콜백 함수
    ws.onclose = () => console.log('WebSocket disconnected');
}

// 현재 선택된 코인으로 WebSocket 연결을 재초기화하는 함수
export function reinitializeWebSocket(selectedCoins, onMessageCallback) {
    // 기존 WebSocket 연결이 있으면 닫습니다.
    if (ws) ws.close();

    // 새로운 WebSocket 연결을 생성하고 데이터 처리를 시작합니다.
    subscribeToWebSocket(selectedCoins, onMessageCallback);
}
