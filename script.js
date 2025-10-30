const calc = async () => {
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    
    console.log(`Calculating route: ${origin} -> ${destination}`);
    
    // 入力値チェック
    if (!origin || !destination) {
        alert('出発地と目的地を入力してください');
        return;
    }
    
    // 結果エリアをクリア
    document.getElementById('result').innerHTML = '';
    
    // ローディング表示
    const loadingElement = document.createElement('p');
    loadingElement.innerText = '計算中...';
    document.getElementById('result').appendChild(loadingElement);
    
    try {
        // 複数のCORSプロキシを順番に試す
        const apiUrl = `https://www.flyingblue.com/kamino/xp-estimation/programme?origin=${origin}&destination=${destination}`;
        
        try {
            console.log('Trying corsproxy.io...');
            const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
            const response3 = await fetch(corsProxyUrl);
            
            if (response3.ok) {
                const data = await response3.json();
                console.log('Success with corsproxy.io:', data);
                if (data && data.length > 0) {
                    createResultElement(data[0]);
                    return;
                }
            }
        } catch (corsError2) {
            console.log('corsproxy.io failed:', corsError2);
        }
        
    } catch (error) {
        console.error('All CORS proxy methods failed:', error);
    }
    
    // ローディング表示をクリア
    document.getElementById('result').innerHTML = '';
    createErrorElement();
}

const createErrorElement = () => {
    const errorElement = document.createElement('p');
    errorElement.innerText = 'データの取得に失敗しました。';
    document.getElementById('result').appendChild(errorElement);
}

const createResultElement = (data) => {
    // ローディング表示をクリア
    document.getElementById('result').innerHTML = '';
    
    const tableElement = document.createElement('table');
    tableElement.style.border = '1px solid black';
    tableElement.style.borderCollapse = 'collapse';
    
    // 距離カテゴリの行
    const distanceTr = document.createElement('tr');
    const distanceLabelTd = document.createElement('td');
    distanceLabelTd.innerText = '距離カテゴリ';
    distanceLabelTd.style.border = '1px solid black';
    distanceLabelTd.style.padding = '8px';
    const distanceValueTd = document.createElement('td');
    distanceValueTd.innerText = data || 'データなし';
    distanceValueTd.style.border = '1px solid black';
    distanceValueTd.style.padding = '8px';
    distanceTr.appendChild(distanceLabelTd);
    distanceTr.appendChild(distanceValueTd);
    tableElement.appendChild(distanceTr);

    // XPの行
    const XpTr = document.createElement('tr');
    const xpLabelTd = document.createElement('td');
    xpLabelTd.innerText = 'XP';
    xpLabelTd.style.border = '1px solid black';
    xpLabelTd.style.padding = '8px';
    // TODO：XP仮置きなので計算する
    const xp = 10;
    const xpValueTd = document.createElement('td');
    xpValueTd.innerText = xp;
    xpValueTd.style.border = '1px solid black';
    xpValueTd.style.padding = '8px';
    XpTr.appendChild(xpLabelTd);
    XpTr.appendChild(xpValueTd);
    tableElement.appendChild(XpTr);

    // XP単価の行
    const PricePerXpTr = document.createElement('tr');
    const pricePerXpLabelTd = document.createElement('td');
    pricePerXpLabelTd.innerText = 'XP単価';
    pricePerXpLabelTd.style.border = '1px solid black';
    pricePerXpLabelTd.style.padding = '8px';
    const priceValue = Number(document.getElementById('price').value);
    const pricePerXp = priceValue / xp;
    const pricePerXpValueTd = document.createElement('td');
    pricePerXpValueTd.innerText = pricePerXp.toFixed(2) + '円';
    pricePerXpValueTd.style.border = '1px solid black';
    pricePerXpValueTd.style.padding = '8px';
    PricePerXpTr.appendChild(pricePerXpLabelTd);
    PricePerXpTr.appendChild(pricePerXpValueTd);
    tableElement.appendChild(PricePerXpTr);

    document.getElementById('result').appendChild(tableElement);
}