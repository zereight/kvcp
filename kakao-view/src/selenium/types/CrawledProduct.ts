/**
 * 쿠팡에서 크롤링한 상품 데이터 타입
 */
export type CrawledProduct = {
  index: number;
  name: string;
  thumbnailUrl: string;
  partnersLink: string;
  landingPageLink: string;
  landingPageHtml: string;
};
