const API_BASE_URL = 'https://fapi.binance.com/fapi/v1'; // 바이낸스 선물 거래소 API의 기본 URL

// 선물 거래 가능한 코인 목록을 가져오는 함수
export async function fetchFuturesCoinList() {
    try {
        const response = await fetch(`${API_BASE_URL}/exchangeInfo`);
        if (!response.ok) throw new Error('Failed to fetch futures coin list');
        const data = await response.json();
        return data.symbols
            .filter(symbol => symbol.status === 'TRADING')
            .map(symbol => ({ symbol: symbol.symbol, baseAsset: symbol.baseAsset }));
    } catch (error) {
        console.error('Error fetching futures coin list:', error);
        return [];
    }
}
