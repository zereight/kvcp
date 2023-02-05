import { useEffect, useState } from "react";

interface Props {
  enabled: boolean;
  query: (props?: any) => Promise<any>;
}

const useQuery = <T>({ enabled, query }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState<T>();

  const refetch = async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      const response = await query();
      const data = await response.json();

      setData(data);
    } catch (error) {
      setIsError(true);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) refetch();
  }, []);

  return {
    refetch,
    isLoading,
    isError,
    data
  };
};

export default useQuery;
