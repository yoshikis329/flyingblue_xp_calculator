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

const distanceCategoryCacheKey = 'flyingblue-distance-categories';
const distanceCategoryCacheDuration = 12 * 60 * 60 * 1000;
const distanceCategoryRequests = new Map();
const distanceCategoryWorkerUrl = 'https://flyingblue-xp-api.yoshikis329.workers.dev';


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
    const xp = getXp(distanceCategory, classType);
    const pricePerXp = calcPricePerXp(xp);
    createResultElement(distanceCategory, classType, xp, pricePerXp);
}


const getDistanceCategory = async (origin, destination) => {
    const apiUrl = new URL('https://www.flyingblue.com/kamino/xp-estimation/programme');
    apiUrl.searchParams.set('origin', origin);
    apiUrl.searchParams.set('destination', destination);
    const cacheKey = `${origin.toUpperCase()}-${destination.toUpperCase()}`;

    try {
        const cachedCategories = JSON.parse(localStorage.getItem(distanceCategoryCacheKey) || '{}');
        const cachedCategory = cachedCategories[cacheKey];
        if (cachedCategory && cachedCategory.expiresAt > Date.now()) {
            return cachedCategory.category;
        }
    } catch (error) {
        console.warn('Could not read the distance category cache:', error);
    }

    if (distanceCategoryRequests.has(cacheKey)) {
        return distanceCategoryRequests.get(cacheKey);
    }

    const request = fetchDistanceCategory(apiUrl, cacheKey);
    distanceCategoryRequests.set(cacheKey, request);
    try {
        return await request;
    } finally {
        distanceCategoryRequests.delete(cacheKey);
    }
}

const fetchDistanceCategory = async (apiUrl, cacheKey) => {
    if (distanceCategoryWorkerUrl.includes('YOUR_SUBDOMAIN')) {
        return new Error('Cloudflare WorkerのURLが未設定です。READMEの手順に従ってscript.jsを設定してください。');
    }

    const workerUrl = new URL(distanceCategoryWorkerUrl);
    workerUrl.searchParams.set('origin', apiUrl.searchParams.get('origin'));
    workerUrl.searchParams.set('destination', apiUrl.searchParams.get('destination'));

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            let detail = '';
            try {
                const errorBody = await response.json();
                detail = errorBody.error ? ` ${errorBody.error}` : '';
            } catch (error) {
                console.warn('Could not read the Worker error response:', error);
            }
            throw new Error(`Cloudflare WorkerからHTTP ${response.status}が返されました。${detail}`);
        }

        const data = await response.json();
        if (!Array.isArray(data) || !Object.hasOwn(xpTable, data[0])) {
            throw new Error('Cloudflare Workerから想定外のデータが返されました。');
        }

        try {
            const cachedCategories = JSON.parse(localStorage.getItem(distanceCategoryCacheKey) || '{}');
            cachedCategories[cacheKey] = {
                category: data[0],
                expiresAt: Date.now() + distanceCategoryCacheDuration
            };
            localStorage.setItem(distanceCategoryCacheKey, JSON.stringify(cachedCategories));
        } catch (error) {
            console.warn('Could not update the distance category cache:', error);
        }
        return data[0];
    } catch (error) {
        console.error('Failed to fetch distance category through Cloudflare Worker:', error);
        return error instanceof Error ? error : new Error('Cloudflare Workerへの接続に失敗しました。時間をおいて再度お試しください。');
    }
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