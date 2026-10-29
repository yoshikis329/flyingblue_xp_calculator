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

let airportDataPromise;


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
            createErrorElement(resultForXpTable.message);
            return;
        }
        createResultElement(resultForXpTable.distanceCategory, classType, resultForXpTable.xp, resultForXpTable.pricePerXp);
        return;
    }

    console.log(`Calculating route: ${origin} -> ${destination}`);

    const distanceCategory = await getDistanceCategory(origin, destination);
    if (distanceCategory instanceof Error) {
        createErrorElement(distanceCategory.message);
        return;
    }
    const xp = getXp(distanceCategory, classType) * 2;
    const pricePerXp = calcPricePerXp(xp);
    createResultElement(distanceCategory, classType, xp, pricePerXp);
}


const getAirportData = async () => {
    if (!airportDataPromise) {
        airportDataPromise = fetch('./airports.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`空港データの読み込みに失敗しました（HTTP ${response.status}）。`);
                }
                return response.json();
            })
            .then(data => {
                if (!data.airports || typeof data.airports !== 'object') {
                    throw new Error('空港データの形式が正しくありません。');
                }
                return data.airports;
            })
            .catch(error => {
                airportDataPromise = undefined;
                throw error;
            });
    }
    return airportDataPromise;
}

const getDistanceCategory = async (origin, destination) => {
    try {
        const airports = await getAirportData();
        const originCode = origin.trim().toUpperCase();
        const destinationCode = destination.trim().toUpperCase();
        const originAirport = airports[originCode];
        const destinationAirport = airports[destinationCode];

        if (!originAirport) {
            throw new Error(`出発地の空港コード「${originCode}」が空港データにありません。`);
        }
        if (!destinationAirport) {
            throw new Error(`目的地の空港コード「${destinationCode}」が空港データにありません。`);
        }

        return categorizeAirports(originAirport, destinationAirport);
    } catch (error) {
        console.error('Failed to determine distance category:', error);
        return error instanceof Error ? error : new Error('距離カテゴリの計算に失敗しました。');
    }
}

const categorizeAirports = (airportA, airportB) => {
    if (airportA[2] === airportB[2]) {
        return 'Domestic';
    }

    const distanceMiles = calculateDistanceMiles(airportA, airportB);
    const boundaryToleranceMiles = 1e-9;
    if (distanceMiles < 2000 - boundaryToleranceMiles) {
        return 'Medium';
    }
    if (distanceMiles < 3500 - boundaryToleranceMiles) {
        return 'Long 1';
    }
    if (distanceMiles < 5000 - boundaryToleranceMiles) {
        return 'Long 2';
    }
    return 'Long 3';
}

const calculateDistanceMiles = (airportA, airportB) => {
    const toRadians = degrees => degrees * Math.PI / 180;
    const [latitudeA, longitudeA] = airportA;
    const [latitudeB, longitudeB] = airportB;
    const latitudeDelta = toRadians(latitudeB - latitudeA);
    const longitudeDelta = toRadians(longitudeB - longitudeA);
    const haversine = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB))
        * Math.sin(longitudeDelta / 2) ** 2;
    const boundedHaversine = Math.min(1, Math.max(0, haversine));
    return 3958.7613 * 2 * Math.atan2(Math.sqrt(boundedHaversine), Math.sqrt(1 - boundedHaversine));
}

const getXp = (distanceCategory, classType) =>  xpTable[distanceCategory][classType] || 0;

const calcPricePerXp = xp =>  Number(document.getElementById('price').value) / xp || 0;

const calcXPAndPricePerXP = async (origin, via, destination, classType) => {
    const originViaDistanceCategory = await getDistanceCategory(origin, via);
    if (originViaDistanceCategory instanceof Error) {
        return originViaDistanceCategory;
    }
    const viaDestinationDistanceCategory = await getDistanceCategory(via, destination);
    if (viaDestinationDistanceCategory instanceof Error) {
        return viaDestinationDistanceCategory;
    }
    const xpOriginVia = getXp(originViaDistanceCategory, classType);
    const xpViaDestination = getXp(viaDestinationDistanceCategory, classType);
    const xp = (xpOriginVia + xpViaDestination) * 2;
    const pricePerXp = calcPricePerXp(xp);
    return {distanceCategory: `${originViaDistanceCategory} + ${viaDestinationDistanceCategory}`, xp, pricePerXp};
}

const createLoadingElement = () => {
    document.getElementById('result').innerHTML = '';    
    const loadingElement = document.createElement('p');
    loadingElement.innerText = '計算中...';
    document.getElementById('result').appendChild(loadingElement);
}

const createErrorElement = (message) => {
    document.getElementById('result').innerHTML = '';
    const errorElement = document.createElement('p');
    errorElement.innerText = message || 'データの取得に失敗しました。時間をおいて再度お試しください。';
    document.getElementById('result').appendChild(errorElement);
}

const createResultElement = (distanceCategory, classType, xp, pricePerXp) => {
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
    xpLabelTd.innerText = '往復あたりのXP';
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