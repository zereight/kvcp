/// <reference types="cypress" />;

/**
 * ! 가끔 cypress 창이 렉먹어서 꺼지는데, 다시켜주면 정상작동할것임
 */

import 쿠팡파트너스_계정 from "../../src/constants/개인정보/쿠팡파트너스_계정.private.json";

const 쿠팡홈페이지 = "https://www.coupang.com/";

const 크롤링하고싶은페이지 = "https://www.coupang.com/np/categories/509624";

const 쿠팡파트너스_메인_URL = "https://partners.coupang.com";
/**
 * 쿠팡파트너스 로그인 페이지를 이렇게 해야함 ㄷ.ㄷ
 * 주기적으로 링크를 갈아주자
 */
const 쿠팡파트너스_로그인_URL =
  "https://login.coupang.com/login/login.pang?rtnUrl=https%3A%2F%2Fpartners.coupang.com%2Fapi%2Fv1%2Fpostlogin%3Fs%3DtZ5JovIsrhU6tIJWtdX0%252BwayxOp4eQ%252B4H2L6Yi1H8oL00NI%252B%252B8S3tupXrk7psR6qk4ow5mEUTNsyohYK4WcEaDrSpmAl%252FyXOypEEpcv60ZlX5JNALBHhSs78WWY4TN7cihjqtpI%253D";

const crawledProducts: {
  id: number;
  index: number;
  name: string;
  title: string;
  partnersLink: string;
}[] = [];
/**
 * cypress를 Electron으로 열어주세요.
 */
describe("쿠팡에서 상품이름들을 크롤링하기", () => {
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

    cy.writeFile(
      `크롤링 결과 ${new Date().toUTCString()}.json`,
      crawledProducts
    );
  });

  it("쿠팡파트너스 로그인하기", () => {
    /**
     * 쿠팡 파트너스 API 아직 발급못받아서,
     * 링크를 크롤링하기로함.
     */
    cy.visit(쿠팡파트너스_로그인_URL, {
      headers: {
        "Accept-Encoding": "gzip, deflate", // Access Denied 에러 방지
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36",
      },
      failOnStatusCode: false, // 쿠팡 프록시 403 에러 방지
    });

    cy.wait(2000);

    cy.get("body").then(($body) => {
      if ($body.find("#login-email-input").length > 0) {
        cy.get("#login-email-input").type(쿠팡파트너스_계정.email);
        cy.get("#login-password-input").type(쿠팡파트너스_계정.pw);

        cy.wait(1000);

        cy.get(
          "body > div.member-wrapper.member-wrapper--flex > div > div > form > div.login__content.login__content--trigger > button"
        ).click();
      }
    });

    cy.wait(1000);
  });

  const 링크따기 = (
    $상품el: JQuery<HTMLElement>,
    crawledProductIndex: number
  ) => {
    /**
     * display none이지만 강제로 클릭
     */
    cy.wrap($상품el).contains("링크 생성").click({ force: true });

    cy.wait(1500);

    /**
     * 비밀번호 입력, 한번하면 몇 분이상 안해도됨
     */

    cy.get("body").then(($body) => {
      if ($body.find("#password").length > 0) {
        cy.get("#password").type(쿠팡파트너스_계정.pw);
        cy.get(
          "body > div:nth-child(9) > div > div.ant-modal-wrap.modal.auth-modal > div > div.ant-modal-content > div > form > div.modal-footer > button.ant-btn.ant-btn-primary.ant-btn-lg"
        ).click();
      }
    });

    cy.wait(1500);

    cy.get(
      "#root > div > div > div.workspace-container > div > div > div.affiliate-page > div > div > div.ant-spin-nested-loading.page-spin-container > div > div > div.cp-row.bg-grey > div > div > div > section > section:nth-child(1) > div > div > div.unselectable-input.shorten-url-input.large"
    ).then(($linkEl) => {
      const link = $linkEl.text();

      crawledProducts[crawledProductIndex].partnersLink = link;
    });
  };

  it("상품들을 크롤링 링크따기 사전작업", async () => {
    /**
     *! 로그인이 되지 않는다면, 로그아웃하고 창닫고 다시 시도할것.
     */
    cy.visit(쿠팡파트너스_메인_URL, {
      headers: {
        "Accept-Encoding": "gzip, deflate", // Access Denied 에러 방지
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36",
      },
      failOnStatusCode: false, // 쿠팡 프록시 403 에러 방지
    });

    crawledProducts.forEach((crawledProduct, crawledProductIndex) => {
      cy.pause();
      // 홈탭 클릭
      cy.get("#app-header > ul > li:nth-child(2) > a > span").click();

      /**
       * 검색
       */
      cy.get(
        "#root > div > div > div.workspace-container > div > div > div.affiliate-page > div > div > div.ant-spin-nested-loading.page-spin-container > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div > div > span > input"
      ).type(`${encodeURIComponent(crawledProduct.name)}{enter}`);

      cy.wait(1500);

      cy.get("body").then(($body) => {
        if ($body.find(".product-item").length) {
          // 검색결과 있으면,

          cy.wait(1500);

          cy.get(".product-item").each(
            ($productElement, productItemIndex, $$productItemList) => {
              const 상품에_적혀있는_텍스트 = $productElement.text();
              if (상품에_적혀있는_텍스트.includes(crawledProduct.name)) {
                cy.wrap($productElement).trigger("mouseover");

                링크따기($productElement, crawledProductIndex);

                return false;
              } else {
                const isLastItem =
                  $$productItemList.length - 1 === productItemIndex;

                if (isLastItem) {
                  /**
                   * 상품에 링크없으면, 상품명과 일치하는 링크못찾은거니까 검색결과 첫번째꺼를 넣어준다,
                   * 근데 이 코드 넣으면 왜 안되지??
                   */
                  if (crawledProduct.partnersLink === 쿠팡홈페이지) {
                    cy.get(".product-item")
                      .first()
                      .then(($상품el) => {
                        링크따기($상품el, crawledProductIndex);
                      });
                  }
                }
              }

              cy.writeFile(`쿠팡상품데이터 beta.json`, crawledProducts);
            }
          );
        }
      });
    });

    // 크롤링을 너무 많이해서 cypress gui터지면, 쿠팡상품데이터 beta를 사용하세요.
    cy.writeFile(
      `쿠팡상품데이터 ${new Date().toUTCString()}.json`,
      crawledProducts
    );
  });
});
