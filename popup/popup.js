import { fetchFuturesCoinList } from '../modules/api.js';
import { saveSelectedCoins, loadSelectedCoins, saveLastKnownPrices, loadLastKnownPrices } from '../modules/storage.js';
import { updateSelectedCoins, displayLastKnownPrices } from '../modules/ui.js';
import { subscribeToWebSocket, reinitializeWebSocket } from '../modules/websocket.js';

let selectedCoins = [];
let lastKnownPrices = {};

// 초기화 함수 정의 및 실행
async function init() {
    lastKnownPrices = loadLastKnownPrices();
    displayLastKnownPrices(lastKnownPrices);

    const coins = await fetchFuturesCoinList();
    setupCoinSelection(coins);

    loadSelectedCoins((loadedCoins) => {
        selectedCoins = loadedCoins;
        updateSelectedCoins(selectedCoins, removeCoin);
        subscribeToWebSocket(selectedCoins, updatePrice);
    });
}

// 선택 해제 시 코인 관련 정보 및 WebSocket 재연결
function removeCoin(symbol) {
    selectedCoins = selectedCoins.filter(s => s !== symbol); // 선택된 코인 제거
    updateSelectedCoins(selectedCoins, removeCoin); // UI 업데이트
    saveSelectedCoins(selectedCoins); // 선택된 코인 저장
    delete lastKnownPrices[symbol]; // 로컬 스토리지에서 가격 제거
    saveLastKnownPrices(lastKnownPrices); // 마지막 가격 정보 저장

    // UI에서 제거
    const pricesDiv = document.getElementById('prices');
    const priceItem = pricesDiv.querySelector(`[data-symbol="${symbol}"]`);
    if (priceItem) {
        pricesDiv.removeChild(priceItem);
    }

    // WebSocket 재연결
    reinitializeWebSocket(selectedCoins, updatePrice);
}


// 실시간 가격 정보를 UI에 업데이트하는 함수
export function updatePrice(data) {
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
    saveLastKnownPrices(lastKnownPrices); // localStorage에 저장

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


// 코인 선택 기능 설정
function setupCoinSelection(coins) {
    const searchInput = document.getElementById('searchInput');
    const coinList = document.getElementById('coinList');

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm === '') {
            coinList.innerHTML = '';
            return;
        }

        const filteredCoins = coins.filter(coin =>
            coin.symbol.toLowerCase().includes(searchTerm) || 
            coin.baseAsset.toLowerCase().includes(searchTerm)
        );

        coinList.innerHTML = '';
        filteredCoins.slice(0, 10).forEach(coin => {
            const li = document.createElement('li');
            li.textContent = `${coin.baseAsset} (${coin.symbol})`;

            li.addEventListener('click', () => {
                if (!selectedCoins.includes(coin.symbol)) {
                    selectedCoins.push(coin.symbol);
                    updateSelectedCoins(selectedCoins, removeCoin);
                    saveSelectedCoins(selectedCoins);
                    subscribeToWebSocket(selectedCoins, updatePrice);
                }
            });

            coinList.appendChild(li);
        });
    });
}

// DOMContentLoaded 이벤트 리스너로 초기화 실행
document.addEventListener('DOMContentLoaded', init);
