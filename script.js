const calc = async () => {
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const response = await fetch(`https://www.flyingblue.com/kamino/xp-estimation/programme?origin=${origin}&destination=${destination}&lang=no&market=NO`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            "Access-Control-Allow-Origin": "*",
        },
    });
    console.log(response);
    if(response.ok) {
        const data = await response.json()[0];
        if(data) {
            createResultElement(data);
            return;
        }
    }
    createErrorElement();
}

const createErrorElement = () => {
    const errorElement = document.createElement('p');
    errorElement.innerText = 'データの取得に失敗しました。';
    document.getElementById('result').appendChild(errorElement);
}

const createResultElement = () => {
    const tableElement = document.createElement('table');
    const distanceTr = document.createElement('tr').createElement('td').innerText = '距離カテゴリ';
    distanceTr.document.createElement('td').innerText= data[0];
    tableElement.appendChild(distanceTr);

    const XpTr = document.createElement('tr').createElement('td').innerText = 'XP';
    // TODO：XP仮置きなので計算する
    const xp = 10
    XpTr.document.createElement('td').innerText= xp;
    tableElement.appendChild(XpTr);

    const PricePerXpTr = document.createElement('tr').createElement('td').innerText = 'XP単価';
    const pricePerXp = Number(document.getElementById('price').value) / xp;
    PricePerXpTr.document.createElement('td').innerText= pricePerXp;
    tableElement.appendChild(PricePerXpTr);

    document.getElementById('result').appendChild(tableElement);
}