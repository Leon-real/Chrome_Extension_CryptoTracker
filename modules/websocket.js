const WS_BASE_URL = 'wss://fstream.binance.com/ws';
let ws = null;

// 웹소켓 연결 및 구독 관리 함수
export function subscribeToWebSocket(selectedCoins, onMessageCallback) {
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
            onMessageCallback(data);
        }
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);

    ws.onclose = () => console.log('WebSocket disconnected');
}

// 현재 선택된 코인과 기존의 WebSocket 연결 해제 후 새로 연결
export function reinitializeWebSocket(selectedCoins, onMessageCallback) {
    if (ws) ws.close(); // 기존 WebSocket 연결 해제

    subscribeToWebSocket(selectedCoins, onMessageCallback); // 새로 연결 및 데이터 처리
}