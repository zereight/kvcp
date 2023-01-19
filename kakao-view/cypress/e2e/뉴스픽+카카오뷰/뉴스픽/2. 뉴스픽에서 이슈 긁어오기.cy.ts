/// <reference types="cypress" />;

import { crawledNewsPickData } from "../../../fixtures/crawledNewsPickData";

const 뉴스픽_파트너스_메인_URL = "https://partners.newspic.kr/main/index";

describe("2. 뉴스픽에서 이슈 긁어오기", () => {
  it("뉴스픽에서 크롤링하기", () => {
    cy.visit(뉴스픽_파트너스_메인_URL);

    // 이슈탭 클릭
    cy.get("#tab_24").click();

    cy.wait(1000);
    cy.scrollTo(10000, 10000);
    cy.wait(1000);
    cy.scrollTo(10000, 10000);
    cy.wait(1000);
    cy.scrollTo(10000, 10000);

    const newsPickDataList: crawledNewsPickData[] = [];

    // 뉴스픽 컨텐츠 읽기
    const 뉴스픽_이슈들 = cy.get("#channelList").children();
    뉴스픽_이슈들.each(($뉴스픽이슈, 뉴스픽이슈Index) => {
      const newsPickData: crawledNewsPickData = {
        index: -1,
        title: "",
        description: "",
        link: "",
      };

      // 제목 담기
      cy.wrap($뉴스픽이슈)
        .get(".info a .text-overflow2")
        .then(($title) => {
          const title = $title.get(뉴스픽이슈Index).textContent || "";
          newsPickData.title = title;
          newsPickData.description = title;

          // 링크복사버튼 강제 클릭
          cy.wrap($뉴스픽이슈)
            .get("#channelList .thumb .box-share .ic-np-link-copy")
            .then(($링크버튼) => {
              cy.wrap($링크버튼[뉴스픽이슈Index]).click({
                force: true,
              });

              /**
               * ! 반드시 cypress 화면의 빈곳에 클릭을 해주어, 포커스를 유지시켜주세요
               * ! 또한, 클립보드 권한 요청이 있을때 허용을 눌러주세요
               */
              cy.window().then((win) => {
                win.navigator.clipboard.readText().then((link: string) => {
                  newsPickData.link = link;

                  // 복사완료 얼럿뜨는거 닫기
                  cy.on("window:alert", () => {
                    // 데이터 추가
                    newsPickData.index = 뉴스픽이슈Index;

                    return false;
                  });
                });
              });
            });

          newsPickDataList.push(newsPickData);
          cy.writeFile(`뉴스픽 크롤링 결과.json`, newsPickDataList);
          cy.wait(100);
        });
    });
  });
});
