// 외부 모듈에서 필요한 함수들을 가져옵니다.
import { fetchFuturesCoinList } from '../modules/api.js';
import { saveSelectedCoins, loadSelectedCoins, saveLastKnownPrices, loadLastKnownPrices } from '../modules/storage.js';
import { updateSelectedCoins, displayLastKnownPrices } from '../modules/ui.js';
import { subscribeToWebSocket, reinitializeWebSocket } from '../modules/websocket.js';

// 선택된 코인들과 마지막으로 알려진 가격들을 저장할 변수를 선언합니다.
let selectedCoins = [];
let lastKnownPrices = {};

// 초기화 함수를 정의합니다.
async function init() {
    // 마지막으로 알려진 가격들을 로드하고 화면에 표시합니다.
    lastKnownPrices = loadLastKnownPrices();
    displayLastKnownPrices(lastKnownPrices);

    // 선물 코인 목록을 가져옵니다.
    const coins = await fetchFuturesCoinList();
    // 코인 선택 기능을 설정합니다.
    setupCoinSelection(coins);

    // 저장된 선택된 코인들을 로드합니다.
    loadSelectedCoins((loadedCoins) => {
        selectedCoins = loadedCoins;
        // UI를 업데이트하고 WebSocket을 구독합니다.
        updateSelectedCoins(selectedCoins, removeCoin);
        subscribeToWebSocket(selectedCoins, updatePrice);
    });
}

// 코인을 선택 해제할 때 호출되는 함수입니다.
function removeCoin(symbol) {
    // 선택된 코인 목록에서 해당 코인을 제거합니다.
    selectedCoins = selectedCoins.filter(s => s !== symbol);
    // UI를 업데이트하고 선택된 코인들을 저장합니다.
    updateSelectedCoins(selectedCoins, removeCoin);
    saveSelectedCoins(selectedCoins);
    // 마지막으로 알려진 가격에서 해당 코인을 제거하고 저장합니다.
    delete lastKnownPrices[symbol];
    saveLastKnownPrices(lastKnownPrices);

    // UI에서 해당 코인의 가격 정보를 제거합니다.
    const pricesDiv = document.getElementById('prices');
    const priceItem = pricesDiv.querySelector(`[data-symbol="${symbol}"]`);
    if (priceItem) {
        pricesDiv.removeChild(priceItem);
    }

    // WebSocket 연결을 재설정합니다.
    reinitializeWebSocket(selectedCoins, updatePrice);
}

// 실시간 가격 정보를 UI에 업데이트하는 함수입니다.
export function updatePrice(data) {
    // 가격 정보를 표시할 요소를 가져옵니다.
    const pricesDiv = document.getElementById('prices');
    // 현재 가격과 이전 가격을 파싱합니다.
    const currentPrice = parseFloat(data.c);
    const previousPrice = lastKnownPrices[data.s] || currentPrice;

    // 해당 심볼의 가격 요소를 찾거나 새로 생성합니다.
    let priceItem = pricesDiv.querySelector(`[data-symbol="${data.s}"]`);
    if (!priceItem) {
        priceItem = document.createElement('div');
        priceItem.setAttribute('data-symbol', data.s);
        priceItem.classList.add('price-item');
        pricesDiv.appendChild(priceItem);
    }

    // 가격 변화에 따른 색상을 결정합니다.
    let priceColor = 'black';
    if (currentPrice > previousPrice) {
        priceColor = 'green';
    } else if (currentPrice < previousPrice) {
        priceColor = 'red';
    }

    // 마지막으로 받은 가격을 저장하고 localStorage에 저장합니다.
    lastKnownPrices[data.s] = currentPrice;
    saveLastKnownPrices(lastKnownPrices);

    // HTML을 업데이트하여 이름, 가격, 등락 퍼센트를 표시합니다.
    priceItem.innerHTML = `
      <span class="coin-name">${data.s}</span>
      <span class="price" style="color: ${priceColor};">$${currentPrice.toFixed(2)}</span>
      <span class="percent" style="color:${parseFloat(data.P) >= 0 ? 'green' : 'red'};">${parseFloat(data.P).toFixed(2)}%</span>
    `;

    // 가격 변화 효과를 추가합니다 (깜빡임).
    priceItem.classList.add('price-changed');
    setTimeout(() => priceItem.classList.remove('price-changed'), 1000);
}

// 코인 선택 기능을 설정하는 함수입니다.
function setupCoinSelection(coins) {
    // 검색 입력란과 코인 목록 요소를 가져옵니다.
    const searchInput = document.getElementById('searchInput');
    const coinList = document.getElementById('coinList');

    // 검색 입력 이벤트 리스너를 추가합니다.
    searchInput.addEventListener('input', () => {
        // 검색어를 소문자로 변환합니다.
        const searchTerm = searchInput.value.toLowerCase();
        
        // 검색어가 비어있으면 코인 목록을 초기화합니다.
        if (searchTerm === '') {
            coinList.innerHTML = '';
            return;
        }

        // 검색어에 맞는 코인들을 필터링합니다.
        const filteredCoins = coins.filter(coin =>
            coin.symbol.toLowerCase().includes(searchTerm) || 
            coin.baseAsset.toLowerCase().includes(searchTerm)
        );

        // 코인 목록을 초기화합니다.
        coinList.innerHTML = '';
        
        // 필터링된 코인들 중 최대 10개를 표시합니다.
        filteredCoins.slice(0, 10).forEach(coin => {
            const li = document.createElement('li');
            li.textContent = `${coin.baseAsset} (${coin.symbol})`;

            // 코인 클릭 이벤트 리스너를 추가합니다.
            li.addEventListener('click', () => {
                // 이미 선택되지 않은 코인인 경우 추가합니다.
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

// DOM 콘텐츠 로드 완료 시 초기화 함수를 실행합니다.
document.addEventListener('DOMContentLoaded', init);
