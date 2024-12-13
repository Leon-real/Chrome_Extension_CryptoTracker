// 바이낸스 선물 거래소 API의 기본 URL을 상수로 정의합니다.
const API_BASE_URL = 'https://fapi.binance.com/fapi/v1'; // 선물 거래 관련 API 요청의 기본 경로

// 선물 거래 가능한 코인 목록을 가져오는 비동기 함수입니다.
export async function fetchFuturesCoinList() {
    try {
        // 바이낸스 API에서 거래소 정보를 가져옵니다.
        const response = await fetch(`${API_BASE_URL}/exchangeInfo`);
        
        // 응답이 정상적이지 않을 경우 에러를 발생시킵니다.
        if (!response.ok) throw new Error('Failed to fetch futures coin list');
        
        // 응답 데이터를 JSON 형식으로 변환합니다.
        const data = await response.json();
        
        // 거래 가능한 심볼만 필터링하고 필요한 정보만 반환합니다.
        return data.symbols
            .filter(symbol => symbol.status === 'TRADING') // 거래 가능한 상태(TRADING)인 심볼만 필터링
            .map(symbol => ({ 
                symbol: symbol.symbol,         // 심볼 이름 (예: BTCUSDT)
                baseAsset: symbol.baseAsset    // 기본 자산 (예: BTC)
            }));
    } catch (error) {
        // 에러 발생 시 콘솔에 에러 메시지를 출력하고 빈 배열을 반환합니다.
        console.error('Error fetching futures coin list:', error);
        return []; // 에러가 발생하면 빈 배열을 반환
    }
}
