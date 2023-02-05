import request from "../utils/request";
import useQuery from "./@shared/useQuery";

export interface CoinInfo {
  english_name: string;
  korean_name: string;
  market: string;
}

const getCoinsAllInfo = async () =>
  request.get({
    url: "https://api.upbit.com/v1/market/all"
  });

const useGetAllCoins = () => {
  const { data, isError, isLoading, refetch } = useQuery<
    CoinInfo[] | undefined
  >({
    enabled: true,
    query: getCoinsAllInfo
  });

  return {
    data,
    isError,
    isLoading,
    refetch
  };
};

export default useGetAllCoins;
