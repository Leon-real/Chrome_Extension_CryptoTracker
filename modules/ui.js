// 선택된 코인 목록 UI 업데이트 함수
export function updateSelectedCoins(selectedCoins, removeCallback) {
    // 선택된 코인들을 표시할 div 요소를 가져옵니다.
    const selectedCoinsDiv = document.getElementById('selectedCoins');
    // 기존 내용을 초기화합니다.
    selectedCoinsDiv.innerHTML = '';

    // 선택된 각 코인에 대해 반복합니다.
    selectedCoins.forEach(symbol => {
        // 새로운 span 요소를 생성합니다.
        const span = document.createElement('span');
        // span의 텍스트를 코인 심볼로 설정합니다.
        span.textContent = symbol;
        // 'selected-coin' 클래스를 추가합니다.
        span.classList.add('selected-coin');

        // span 클릭 시 해당 코인을 제거하는 이벤트 리스너를 추가합니다.
        span.addEventListener('click', () => {
            removeCallback(symbol);
        });

        // 생성한 span을 selectedCoinsDiv에 추가합니다.
        selectedCoinsDiv.appendChild(span);
    });
}

// 마지막으로 받은 가격을 화면에 표시하는 함수
export function displayLastKnownPrices(lastKnownPrices) {
    // 가격을 표시할 div 요소를 가져옵니다.
    const pricesDiv = document.getElementById('prices');
    // 기존 내용을 초기화합니다.
    pricesDiv.innerHTML = '';

    // lastKnownPrices 객체의 각 키(코인 심볼)에 대해 반복합니다.
    Object.keys(lastKnownPrices).forEach(symbol => {
        // 각 코인의 가격 정보를 표시할 div 요소를 생성합니다.
        const priceItem = document.createElement('div');
        // data-symbol 속성을 설정합니다.
        priceItem.setAttribute('data-symbol', symbol);
        // 'price-item' 클래스를 추가합니다.
        priceItem.classList.add('price-item');

        // HTML 내용을 설정합니다: 코인 이름, 가격, 퍼센트(초기값 '-')
        priceItem.innerHTML = `
          <span class="coin-name">${symbol}</span>
          <span class="price">$${lastKnownPrices[symbol].toFixed(2)}</span>
          <span class="percent">-</span>
        `;

        // 생성한 priceItem을 pricesDiv에 추가합니다.
        pricesDiv.appendChild(priceItem);
    });
}
