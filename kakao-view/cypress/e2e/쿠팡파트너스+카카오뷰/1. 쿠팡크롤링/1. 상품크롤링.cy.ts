/// <reference types="cypress" />;

import { crawledProducts } from "../../../fixtures/crawledProducts";

const 쿠팡홈페이지 = "https://www.coupang.com/";

const 크롤링하고싶은페이지 = "https://www.coupang.com/np/campaigns/3862";

/**
 * * electron으로 열어주세요
 */

describe("1. 상품크롤링", () => {
  it("크롤링 원하는 페이지를 입력하면, 상품리스트 크롤링하여 json으로 저장", () => {
    cy.visit(크롤링하고싶은페이지, {
      headers: {
        "Accept-Encoding": "gzip, deflate", // Access Denied 에러 방지
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36",
      },
      failOnStatusCode: false, // 쿠팡 프록시 403 에러 방지
    });

    const productElements = cy.get("#productList > li");

    /**
     * 쿠팡 상품 데이터들을 가져온다.
     */
    productElements.each(($productElement, index) => {
      const productElement = cy.wrap($productElement);

      productElement.get(".name").then(($names) => {
        const productName = $names[index].textContent;
        if (productName) {
          crawledProducts.push({
            id: $productElement.data("productId"), // data-product-id를 가져온다.,
            name: productName.replace(/\n/gi, "").split(",")[0].trim(), // 쿠팡은 ,를 기준으로 첫번째가 상품명진짜인 경우가 많은듯
            title: productName.replace(/\n/gi, "").split(",")[0].trim(),
            partnersLink: 쿠팡홈페이지,
            index,
          });
        }
      });
    });

    cy.writeFile(`쿠팡 크롤링 결과.json`, crawledProducts);
  });
});
