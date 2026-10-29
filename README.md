# flyingblue_xp_calculator

空港コード、座席クラス、航空券の金額からFlying BlueのXPを計算するツールです。
金額は往復運賃を入力し、XPとXP単価も往復分で表示します。

https://yoshikis329.github.io/flyingblue_xp_calculator/

## 距離カテゴリの判定

Flying BlueのAPIやプロキシは使わず、同梱の `airports.json` にある空港座標と国コードから判定します。

- 同じ国の空港間: Domestic
- 国際線で2,000マイル未満: Medium
- 2,000マイル以上3,500マイル未満: Long 1
- 3,500マイル以上5,000マイル未満: Long 2
- 5,000マイル以上: Long 3

距離は空港間の大圏距離（直線距離）です。飛行経路やFlying Blue独自の判定とは差が出る場合があります。境界値は重複しないよう、2,000・3,500・5,000マイルちょうどをそれぞれ次の距離カテゴリに含めます。Domesticは距離にかかわらず優先します。

## 空港データ

`airports.json` は [OurAirports](https://ourairports.com/data/) の空港データから、IATAコードがあり定期便のある空港を抽出したものです。OurAirportsのデータはパブリックドメインで、正確性の保証はありません。データを更新する場合は同じ条件で `airports.csv` から生成してください。
