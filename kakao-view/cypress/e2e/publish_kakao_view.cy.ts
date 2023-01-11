/// <reference types="cypress" />;

import { kakaoViewDataList } from "../../src/constants/kakaoViewData";
import { 시간 } from "../../src/constants/time";

const 카카오뷰_창작센터_URL = "https://creators.kakao.com/";
const 카카오뷰_내_보드창작 = "https://creators.kakao.com/my-channels";

describe("template spec", () => {
  it("카카오뷰 창작센터에 로그인 한다", () => {
    /**
     * * QR 로그인하기
     */
    cy.visit(카카오뷰_창작센터_URL);

    const hasLoginButton = cy.find(".link_login", { timeout: 1000 });
    if (!hasLoginButton) {
      return;
    }
    cy.get(".link_login").click();

    cy.get("button").contains("QR코드 로그인").click();

    cy.pause();
  });

  it("원하는 채널의 보드관리 화면 들어간다.", () => {
    cy.visit(카카오뷰_내_보드창작);
    /**
     * 원하는 채널 고르기
     */

    cy.get("#mainContent > ul").contains("쇼핑혁").click();

    /**
     * 보드 관리화면 들어가기
     */
    cy.get(
      "#root > div.container-doc > main > section > aside > nav > ul > li:nth-child(2) > a"
    ).click();
  });

  it("내가 원하는 보드제목/설명/링크를 넣는다.", () => {
    kakaoViewDataList.forEach((kakaoViewData) => {
      /**
       * 새 보드 만들기 클릭
       */
      cy.get("#mainContent > div.wrap_tit > div > a").click();

      const 쿠팡제휴문구 =
        "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";
      cy.get("#boardTitle").type(kakaoViewData.title);
      cy.get("#boardCmt").type(
        `${kakaoViewData.description}
      👇
      👇
      ${쿠팡제휴문구}`
      );

      /**
       * 3번째 보드 유형으로 변경
       */
      cy.get(
        "#mainContent > div.editor_board > div > div.area_editor > div:nth-child(3) > div.edit_template > ul > li:nth-child(3) > button"
      ).click();

      kakaoViewData.products.forEach((data) => {
        /**
         * 쿠팡 파트너스링크를 넣기 위해서 "링크 직접입력" 클릭
         */
        cy.get(
          "#mainContent > div.editor_board > div > div.area_contents > div.tab_g.tab_type2 > ul > li:nth-child(2) > a"
        ).click();

        /**
         * 쿠팡 파트너스 링크 입력
         */
        cy.get(
          "#mainContent > div.editor_board > div > div.area_contents > div.cont_tab > form > div.item_form.type_search > div > input"
        ).type(data.link);

        /**
         * 링크 찾기 버튼 클릭
         */
        cy.get(
          "#mainContent > div.editor_board > div > div.area_contents > div.cont_tab > form > div.item_form.type_search > div > div.util_tf > button.btn_search"
        ).click();

        /**
         * 검색하는데 조금 오래걸림
         */
        cy.wait(500);

        /**
         * 담기 버튼 클릭
         */
        cy.get(
          "#mainContent > div.editor_board > div > div.area_contents > div.cont_tab > form > div.view_contents > ul > li > div.wrap_util > button"
        ).click();

        /**
         * 발행하기 클릭
         */
        cy.get(
          "#mainContent > div.wrap_btn > div.align_r > button.btn_g.btn_primary.btn_icon"
        ).click();

        /**
         * 예약발행 항목 선택
         */
        cy.get(
          "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(2) > label > span.ico_creators.ico_radio"
        ).click();
        /**
         * (오늘 날짜임을 가정)
         * 시간에 따라 발행시점 선택
         */
        cy.get(
          "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(5) > div > a"
        ).click();

        cy.get(
          "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(5) > div > div > ul"
        )
          .contains(시간[data.publishTime].시)
          .click();

        cy.get(
          "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(7) > div > a"
        ).click();
        cy.get(
          "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(7) > div > div > ul"
        )
          .contains(시간[data.publishTime].분)
          .click();

        /**
         * 카테고리 선택
         */
        cy.get("#layer > div > div > div.layer_body")
          .contains("쇼핑 정보")
          .click();
        cy.get("#layer > div > div > div.layer_body").contains("리빙").click();

        /**
         * 수익문구 약관 선택
         */
        cy.get(
          "#layer > div > div > div.layer_body > div > div:nth-child(4) > div > label > span.ico_creators.ico_check"
        ).click();

        /**
         * 2번 실행될 수도 있어서, 발행하기는 스스로 선택하기
         */
        cy.pause();
      });
    });
  });
});
