/// <reference types="cypress" />;

const 쿠팡홈페이지 = "https://www.coupang.com/";

const getCoupangProductLink = (productId: number) => {
  return `https://www.coupang.com/vp/products/${productId}`;
};

/**
 * cypress를 Electron으로 열어주세요.
 */
describe("쿠팡에서 상품이름들을 크롤링하기", () => {
  it("크롤링 원하는 페이지를 입력하면, 상품리스트 크롤링하여 json으로 저장", () => {
    const 크롤링하고싶은페이지 =
      "https://www.coupang.com/np/campaigns/82/components/194906?listSize=60&brand=&offerCondition=&filterType=&isPriceRange=false&minPrice=&maxPrice=&page=1&channel=user&fromComponent=Y&selectedPlpKeepFilter=&sorter=bestAsc&filter=&component=194906&rating=0";

    const crawledProducts: {
      id: number;
      name: string;
    }[] = [];

    cy.visit(크롤링하고싶은페이지, {
      headers: {
        "Accept-Encoding": "gzip, deflate", // Access Denied 에러 방지
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36",
      },
      failOnStatusCode: false, // 쿠팡 프록시 403 에러 방지
    });

    const productElements = cy.get("#productList > li");

    productElements.each(($productElement, index) => {
      const productElement = cy.wrap($productElement);

      productElement.get(".name").then(($names) => {
        const productName = $names[index].textContent;
        if (productName) {
          crawledProducts.push({
            id: $productElement.data("productId"), // data-product-id를 가져온다.,
            name: productName.replace(/\n/gi, "").trim(),
          });
        }
      });
    });

    cy.writeFile(
      `쿠팡상품데이터 ${new Date().toUTCString()}.json`,
      crawledProducts
    );
  });
});
