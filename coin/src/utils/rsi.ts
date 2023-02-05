import { RSI } from "technicalindicators";
import getSum from "./sum";

interface Props {
  recentlyPrices: number[];
}

const getRSI = ({ recentlyPrices }: Props) => {
  const diff = (() => {
    const originalData: number[] = [...recentlyPrices];

    const shiftedData: number[] = (() => {
      const _data = [0, ...recentlyPrices];
      _data.pop();

      return _data;
    })();

    const res = originalData.reduce((acc, curr, index) => {
      if (index !== 0) acc.push(curr - shiftedData[index]);

      return acc;
    }, [] as number[]);

    return res;
  })();

  const positiveData = diff.reduce((acc, curr) => {
    acc.push(curr > 0 ? curr : 0);

    return acc;
  }, [] as number[]);

  const negativeData = diff.reduce((acc, curr) => {
    acc.push(curr < 0 ? curr : 0);

    return acc;
  }, [] as number[]);

  const averagePositiveData = getSum(positiveData) / positiveData.length;
  const averageNegativeData = getSum(negativeData) / negativeData.length;

  const relativeStrength = averagePositiveData / averageNegativeData;
  const relativeStrengthIndex = 1 - 1 / (1 + relativeStrength);

  return relativeStrengthIndex;
};

export default getRSI;
