// 선택된 코인 목록을 Chrome 스토리지에 저장하는 함수
export function saveSelectedCoins(selectedCoins) {
    // Chrome의 sync 스토리지에 선택된 코인 목록을 저장합니다.
    chrome.storage.sync.set({ selectedCoins }, () => {
        // 저장이 완료되면 콘솔에 로그를 출력합니다.
        console.log('Selected coins saved:', selectedCoins);
    });
}

// Chrome 스토리지에서 저장된 코인 목록을 불러오는 함수
export function loadSelectedCoins(callback) {
    // Chrome의 sync 스토리지에서 'selectedCoins' 키의 값을 가져옵니다.
    chrome.storage.sync.get(['selectedCoins'], (result) => {
        // 결과를 콜백 함수로 전달합니다. 값이 없으면 빈 배열을 반환합니다.
        callback(result.selectedCoins || []);
    });
}

// 마지막으로 받은 가격을 localStorage에 저장하는 함수
export function saveLastKnownPrices(lastKnownPrices) {
    // 객체를 JSON 문자열로 변환하여 localStorage에 저장합니다.
    localStorage.setItem('lastKnownPrices', JSON.stringify(lastKnownPrices));
}

// localStorage에서 마지막으로 받은 가격을 불러오는 함수
export function loadLastKnownPrices() {
    // localStorage에서 'lastKnownPrices' 키의 값을 가져옵니다.
    const storedPrices = localStorage.getItem('lastKnownPrices');
    // 저장된 값이 있으면 JSON 파싱하여 반환하고, 없으면 빈 객체를 반환합니다.
    return storedPrices ? JSON.parse(storedPrices) : {};
}
