// 선택된 코인 목록을 저장하는 함수
export function saveSelectedCoins(selectedCoins) {
    chrome.storage.sync.set({ selectedCoins }, () => {
        console.log('Selected coins saved:', selectedCoins);
    });
}

// 저장된 코인 목록을 불러오는 함수
export function loadSelectedCoins(callback) {
    chrome.storage.sync.get(['selectedCoins'], (result) => {
        callback(result.selectedCoins || []);
    });
}

// 마지막으로 받은 가격을 localStorage에 저장하는 함수
export function saveLastKnownPrices(lastKnownPrices) {
    localStorage.setItem('lastKnownPrices', JSON.stringify(lastKnownPrices));
}

// localStorage에서 마지막으로 받은 가격을 불러오는 함수
export function loadLastKnownPrices() {
    const storedPrices = localStorage.getItem('lastKnownPrices');
    return storedPrices ? JSON.parse(storedPrices) : {};
}
