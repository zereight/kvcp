import { 시간 } from "./time";

type KakaoViewData = {
  title: string;
  description: string;
  products: {
    link: string;
    publishTime: keyof typeof 시간;
  }[];
};

/**
 * {
    title: "💝 아침은 꼭 거르는 아들과 남편을 위해서",
    description: "필립스 데일리 콜렉션 토스트기",
    products: [
      {
        link: "https://link.coupang.com/a/LVSwO",
        publishTime: "점심",
      },
    ],
  },
 */

export const kakaoViewDataList: KakaoViewData[] = [
  // 아침
  // 점심
  // 저녁
  // 밤
];
