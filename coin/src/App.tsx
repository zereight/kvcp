import { useEffect, useMemo, useState } from "react";
import useCandle from "./hooks/useCandle";
import useGetAllCoins, { CoinInfo } from "./hooks/useGetAllCoins";
import getRSI from "./utils/rsi";

const App = () => {
  const { data: coinInfos } = useGetAllCoins();
  const [selectedCoinInfo, setSelectedCoinInfo] = useState<CoinInfo>();
  const { data: candleInfo, refetch: refetchCandleInfos } = useCandle({
    timeUnit: "minutes",
    timeDelta: 240,
    coinInMarket: selectedCoinInfo?.market,
    count: 200
  });
  const [rsiInfo, setRsiInfo] = useState({});

  useEffect(() => {
    if (selectedCoinInfo) {
      refetchCandleInfos();
    }
  }, [selectedCoinInfo]);

  useEffect(() => {
    if (candleInfo) {
      // console.log(candleInfo);

      const rsi = getRSI({
        recentlyPrices: candleInfo.map(({ trade_price }) => trade_price)
      });

      console.log(rsi);
    }
  }, [candleInfo]);

  return (
    <>
      <span>현재 선택된 코인: {selectedCoinInfo?.korean_name}</span>
      <ul>
        {coinInfos &&
          coinInfos.map(coinInfo => {
            return (
              <li
                key={coinInfo.market}
                onClick={() => setSelectedCoinInfo(coinInfo)}
              >
                {coinInfo.korean_name}
              </li>
            );
          })}
      </ul>
    </>
  );
};

export default App;
