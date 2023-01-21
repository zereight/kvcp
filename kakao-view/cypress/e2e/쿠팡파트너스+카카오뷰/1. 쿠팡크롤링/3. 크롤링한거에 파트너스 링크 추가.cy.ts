/// <reference types="cypress" />;

import 쿠팡파트너스_계정 from "../../../fixtures/개인정보/쿠팡파트너스_계정.private.json";

import crawledProducts from "../../../../쿠팡 크롤링 결과.json";

/**
 * ! 가끔 cypress 창이 렉먹어서 꺼지는데, 다시켜주면 정상작동할것임
 *  로그인이 꺼지면, beta에 기록되어있으니까, 쿠팡상품데이터에서 거기까지만 제거하고 다시 돌리면된다.
 */

const 쿠팡홈페이지 = "https://www.coupang.com/";
const 쿠팡파트너스_메인_URL = "https://partners.coupang.com";

describe("3. 크롤링한거에 파트너스 링크 추가", () => {
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
      // 렉걸려서 꺼지는 경우가 있기 때문에 매번 수동으로 시작을 눌러주오록함
      cy.pause();

      // 홈탭 클릭
      cy.get("#app-header > ul > li:nth-child(2) > a > span").click();

      /**
       * 검색
       */
      cy.get(
        "#root > div > div > div.workspace-container > div > div > div.affiliate-page > div > div > div.ant-spin-nested-loading.page-spin-container > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div > div > span > input"
      ).type(`${encodeURIComponent(crawledProduct.name)}{enter}`, {
        delay: 0,
      });

      cy.wait(1500);

      cy.get("body").then(($body) => {
        if ($body.find(".product-item").length) {
          // 검색결과 있으면,

          cy.wait(500);

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

              // 도중에 프로그램이 꺼지는 경우 백업하기 위해 사용
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

const 링크따기 = (
  $상품el: JQuery<HTMLElement>,
  crawledProductIndex: number
) => {
  /**
   * display none이지만 강제로 클릭
   */
  cy.wrap($상품el).contains("링크 생성").click({ force: true });

  cy.wait(500);

  /**
   * 비밀번호 입력, 한번하면 몇 분이상 안해도됨
   */

  cy.get("body").then(($body) => {
    if ($body.find("#password").length > 0) {
      cy.get("#password").type(쿠팡파트너스_계정.pw, { delay: 0 });
      cy.get(
        "body > div:nth-child(9) > div > div.ant-modal-wrap.modal.auth-modal > div > div.ant-modal-content > div > form > div.modal-footer > button.ant-btn.ant-btn-primary.ant-btn-lg"
      ).click();
    }
  });

  cy.wait(100);

  cy.get(
    "#root > div > div > div.workspace-container > div > div > div.affiliate-page > div > div > div.ant-spin-nested-loading.page-spin-container > div > div > div.cp-row.bg-grey > div > div > div > section > section:nth-child(1) > div > div > div.unselectable-input.shorten-url-input.large"
  ).then(($linkEl) => {
    const link = $linkEl.text();

    crawledProducts[crawledProductIndex].partnersLink = link;
  });
};
