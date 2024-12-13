// 선택된 코인 목록 UI 업데이트 함수
export function updateSelectedCoins(selectedCoins, removeCallback) {
    const selectedCoinsDiv = document.getElementById('selectedCoins');
    selectedCoinsDiv.innerHTML = '';

    selectedCoins.forEach(symbol => {
        const span = document.createElement('span');
        span.textContent = symbol;
        span.classList.add('selected-coin');

        span.addEventListener('click', () => {
            removeCallback(symbol);
        });

        selectedCoinsDiv.appendChild(span);
    });
}

// 마지막으로 받은 가격을 화면에 표시하는 함수
export function displayLastKnownPrices(lastKnownPrices) {
    const pricesDiv = document.getElementById('prices');
    pricesDiv.innerHTML = '';

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
