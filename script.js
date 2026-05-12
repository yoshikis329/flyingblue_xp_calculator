const xpTable = {
    "Domestic": {
        "Economy": 2,
        "PremiumEconomy": 4,
        "Business": 6,
        "First": 10
    },
    "Medium": {
        "Economy": 5,
        "PremiumEconomy": 10,
        "Business": 15,
        "First": 25
    },
    "Long 1": {
        "Economy": 8,
        "PremiumEconomy": 16,
        "Business": 24,
        "First": 40
    },
    "Long 2": {
        "Economy": 10,
        "PremiumEconomy": 20,
        "Business": 30,
        "First": 50
    },
    "Long 3": {
        "Economy": 12,
        "PremiumEconomy": 24,
        "Business": 36,
        "First": 60
    }
};


const calc = async () => {
    const origin = document.getElementById('origin').value;
    const via = document.getElementById('via').value;
    const destination = document.getElementById('destination').value;
    const classType = document.getElementById('classType').value;


    // 入力値チェック
    if (!origin || !destination) {
        alert('出発地と目的地を入力してください');
        return;
    }

    console.log(`Calculating route: ${origin} -> ${destination}`);
    
    // ローディング表示
    createLoadingElement();

    if (via) {
        console.log(`Calculating route: ${origin} -> ${via} -> ${destination}`);
        const resultForXpTable = await calcXPAndPricePerXP(origin, via, destination, classType);
        if (resultForXpTable instanceof Error) {
            createErrorElement();
            return;
        }
        createResultElement(resultForXpTable.distanceCategory, classType, resultForXpTable.xp, resultForXpTable.pricePerXp);
        return;
    }

    console.log(`Calculating route: ${origin} -> ${destination}`);

    const distanceCategory = await getDistanceCategory(origin, destination, classType);
    if (distanceCategory instanceof Error) {
        createErrorElement();
        return;
    }
    const xp = getXp(distanceCategory, classType);
    const pricePerXp = calcPricePerXp(xp);
    createResultElement(distanceCategory, classType, xp, pricePerXp);
}


const getDistanceCategory = async (origin, destination, classType) => {
    // 複数のCORSプロキシを順番に試す
    const apiUrl = `https://www.flyingblue.com/kamino/xp-estimation/programme?origin=${origin}&destination=${destination}`;
    
    try {
        console.log('Trying corsproxy.io...');
        const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
        const response = await fetch(corsProxyUrl);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Success with corsproxy.io:', data);
            if (data && data.length > 0) {
                return data[0];
            }
        }
        return new Error('Failed to fetch distance category');
    } catch (corsError2) {
        console.log('corsproxy.io failed:', corsError2);
        return new Error('All CORS proxy methods failed');
    }        
}

const getXp = (distanceCategory, classType) =>  xpTable[distanceCategory][classType] || 0;

const calcPricePerXp = xp =>  Number(document.getElementById('price').value) / xp || 0;

const calcXPAndPricePerXP = async (origin, via, destination, classType) => {
    const originViaDistanceCategory = await getDistanceCategory(origin, via, classType);
    const viaDestinationDistanceCategory = await getDistanceCategory(via, destination, classType);
    if (originViaDistanceCategory instanceof Error || viaDestinationDistanceCategory instanceof Error) {
        return new Error('距離カテゴリの取得に失敗しました');
    }
    const xpOriginVia = getXp(originViaDistanceCategory, classType);
    const xpViaDestination = getXp(viaDestinationDistanceCategory, classType);
    const xp = xpOriginVia + xpViaDestination;
    const pricePerXp = calcPricePerXp(xp);
    return {distanceCategory: `${originViaDistanceCategory} + ${viaDestinationDistanceCategory}`, xp, pricePerXp};
}

const createLoadingElement = () => {
    document.getElementById('result').innerHTML = '';    
    const loadingElement = document.createElement('p');
    loadingElement.innerText = '計算中...';
    document.getElementById('result').appendChild(loadingElement);
}

const createErrorElement = () => {
    const errorElement = document.createElement('p');
    errorElement.innerText = 'データの取得に失敗しました。';
    document.getElementById('result').appendChild(errorElement);
}

const createResultElement = (distanceCategory, classType, xp, pricePerXp) => {
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
    distanceValueTd.innerText = distanceCategory || 'データなし';
    distanceValueTd.style.border = '1px solid black';
    distanceValueTd.style.padding = '8px';
    distanceTr.appendChild(distanceLabelTd);
    distanceTr.appendChild(distanceValueTd);
    tableElement.appendChild(distanceTr);

    // XPの行
    const XpTr = document.createElement('tr');
    const xpLabelTd = document.createElement('td');
    xpLabelTd.innerText = '片道あたりのXP';
    xpLabelTd.style.border = '1px solid black';
    xpLabelTd.style.padding = '8px';

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
    const pricePerXpValueTd = document.createElement('td');
    pricePerXpValueTd.innerText = pricePerXp.toFixed(2) + '円';
    pricePerXpValueTd.style.border = '1px solid black';
    pricePerXpValueTd.style.padding = '8px';
    PricePerXpTr.appendChild(pricePerXpLabelTd);
    PricePerXpTr.appendChild(pricePerXpValueTd);
    tableElement.appendChild(PricePerXpTr);

    document.getElementById('result').appendChild(tableElement);
}