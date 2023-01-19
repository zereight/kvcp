/// <reference types="cypress" />;

import { 시간 } from "../../../fixtures/time";
import newPickDataList from "../../../../뉴스픽 크롤링 결과.json";

/**
 * ! 주의) 뉴스픽에서 활동정보에 카카오뷰 채널명을 기입해야 수익이 정산됩니다.
 */

/**
 * ! 포스팅 썸네일이 없는 주소같은경우 카카오뷰에서 등록이 안되니 수동으로 걸러주셔야합니다.
 */

/**
 * ! 첫 발행시에는 , 첫발행 축하 팝업으로 인해 한번 실패합니다.
 */

describe("2. 카카오뷰에 뉴스픽 보드 발행하기", () => {
  const 카카오뷰_내_보드창작 = "https://creators.kakao.com/my-channels";

  const 내_채널리스트 = ["뉴스혁", "유머혁", "유머러스혁"] as const;
  /**
   * 내 채널
   * ! 채널 당 하루 발행량은 10개 입니다 주의해주세요
   */
  const 지금_발행할_내_채널: typeof 내_채널리스트[number] = "유머혁";

  /**
   * 각 채널별로 예약시간대 정하기
   */
  const 채널별_예약시간: Record<
    typeof 내_채널리스트[number],
    keyof typeof 시간
  > = {
    유머러스혁: "아침",
    뉴스혁: "점심",
    유머혁: "저녁",
  };

  /**
   * 카테고리를 설정합니다.
   */
  const category1 = "시선이 담긴 이슈";
  const category2 = "유머";

  // 발행하고자 하는 날짜(일)을 입력한다. (월은 현재 달로 가정한다.)
  const day = 20;

  it("원하는 채널의 보드  화면으로 들어간다.", () => {
    cy.visit(카카오뷰_내_보드창작);

    /**
     * 원하는 채널 고르기
     */
    cy.get("#mainContent > ul").contains(지금_발행할_내_채널).click();

    /**
     * 보드 관리화면 들어가기
     */
    cy.get(
      "#root > div.container-doc > main > section > aside > nav > ul > li:nth-child(2) > a"
    ).click();
  });

  it("원하는 채널에 들어간다.", () => {
    /**
     * 카카오뷰에 올릴 데이터들을 순회하여 보드를 등록합니다.
     */
    newPickDataList.forEach((newPickData) => {
      /**
       * 새 보드 만들기 클릭
       */
      cy.get("#mainContent > div.wrap_tit > div > a").click();

      /**
       * 뉴스픽 제휴 문구 입력
       */
      const 제휴문구 =
        "이 포스팅은 뉴스픽 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

      cy.get("#boardTitle").type(`${newPickData.title}`);

      cy.get("#boardCmt").type(
        `${newPickData.title}
            👇
            👇
            ${제휴문구}`
      );

      /**
       * 3번째 보드 유형으로 변경
       */
      cy.get(
        "#mainContent > div.editor_board > div > div.area_editor > div:nth-child(3) > div.edit_template > ul > li:nth-child(3) > button"
      ).click();

      /**
       * 뉴스픽 파트너스링크를 넣기 위해서 "링크 직접입력" 클릭
       */
      cy.get(
        "#mainContent > div.editor_board > div > div.area_contents > div.tab_g.tab_type2 > ul > li:nth-child(2) > a"
      ).click();

      /**
       * 뉴스픽 파트너스 링크 입력
       */
      cy.get(
        "#mainContent > div.editor_board > div > div.area_contents > div.cont_tab > form > div.item_form.type_search > div > input"
      ).type(newPickData.link);

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
       * !   발행 팝업이 떴음
       */

      /**
       * 예약발행 항목 선택
       */
      cy.get(
        "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(2) > label > span.ico_creators.ico_radio"
      ).click();

      /**
       * 시간에 따라 발행시점 선택
       */
      cy.get(
        "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(5) > div > a"
      ).click();

      cy.get(
        "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(5) > div > div > ul"
      )
        .contains(시간[채널별_예약시간[지금_발행할_내_채널]].시)
        .click();

      cy.get(
        "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(7) > div > a"
      ).click();
      cy.get(
        "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(7) > div > div > ul"
      )
        .contains(시간[채널별_예약시간[지금_발행할_내_채널]].분)
        .click();

      /**
       * 날짜 입력란 (같은 월 임을 가정한다)
       */
      cy.get(
        "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div.item_form.type_calendar > div.DayPickerInput > input"
      ).click();

      cy.get(
        `#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div.item_form.type_calendar > div.DayPickerInput > div > div > div > div > div.DayPicker-Months > div > div.DayPicker-Body `
      )
        .contains(day)
        .click({ force: true })
        .click({ force: true });

      cy.wait(200);

      /**
       * 카테고리 선택
       */
      cy.get("#layer > div > div > div.layer_body").contains(category1).click();
      cy.get("#layer > div > div > div.layer_body").contains(category2).click();

      /**
       * 수익문구 약관 선택
       */
      cy.get(
        "#layer > div > div > div.layer_body > div > div:nth-child(4) > div > label > span.ico_creators.ico_check"
      ).click();

      /**
       * 발행하기 클릭
       */
      cy.get(
        "#layer > div > div > div.layer_body > div > div.wrap_btn.align_r > button.btn_g.btn_primary.btn_icon"
      ).click();

      /**
       * 발행완료 확인
       */
      cy.get("#layer > div > div > div.layer_foot > div > button").click();

      /**
       * 예약발행숫자읽기
       * #mainContent > div.tab_g > ul > li:nth-child(2) > a
       */

      /**
       * 2번 실행될 수도 있어서, 발행하기는 스스로 선택하기
       */
      cy.pause();
    });
  });
});
