import request from "../utils/request";
import useQuery from "./@shared/useQuery";

interface CandleInfo {
  candle_acc_trade_price: number;
  candle_acc_trade_volume: number;
  candle_date_time_kst: string;
  candle_date_time_utc: string;
  high_price: number;
  low_price: number;
  market: string;
  opening_price: number;
  timestamp: number;
  trade_price: number;
  unit: number;
}

interface Props {
  timeUnit?: "minutes" | "days";
  timeDelta?: 1 | 3 | 5 | 10 | 30 | 60 | 240;
  coinInMarket?: string;
  count?: number;
}

const getCandleInfo = async ({
  timeUnit = "minutes",
  timeDelta = 60,
  coinInMarket = "KRW-BTC",
  count = 3,
}: Props) =>
  request.get({
    url: `https://api.upbit.com/v1/candles/${timeUnit}/${timeDelta}?market=${coinInMarket}&count=${count}`,
  });

const useCandle = ({
  timeUnit = "minutes",
  timeDelta = 1,
  coinInMarket = "KRW-BTC",
  count = 3,
}: Props) => {
  const { data, isError, isLoading, refetch } = useQuery<
    CandleInfo[] | undefined
  >({
    enabled: false,
    query: () =>
      getCandleInfo({
        timeUnit,
        timeDelta,
        coinInMarket,
        count,
      }),
  });

  return {
    data,
    isError,
    isLoading,
    refetch,
  };
};

export default useCandle;
