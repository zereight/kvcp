/// <reference types="cypress" />;

const 카카오뷰_창작센터_URL = "https://creators.kakao.com/";
const 카카오메일아이디 = "www.youtube.com";
const 카카오메일비밀번호 = "비밀번호를 입력해주세요";

describe("template spec", () => {
  it("카카오뷰 창작센터에 로그인 한다", () => {
    /**
     * * QR 로그인하기
     */
    cy.visit(카카오뷰_창작센터_URL);

    cy.get(".link_login").click();

    cy.get("#input-loginKey").type(카카오메일아이디);
    cy.get("#input-password").type(카카오메일비밀번호);

    cy.get("button").contains("QR코드 로그인").click();

    cy.pause();
  });

  it("원하는 채널의 보드관리 화면 들어간다.", () => {
    /**
     * 원하는 채널 고르기
     */

    cy.contains("쇼핑혁").click();

    /**
     * 보드 관리화면 들어가기
     */
    cy.get(
      "#root > div.container-doc > main > section > aside > nav > ul > li:nth-child(2) > a"
    ).click();

    /**
     * 새 보드 만들기 클릭
     */
    cy.get("#mainContent > div.wrap_tit > div > a").click();
  });

  it("내가 원하는 보드제목/설명/링크를 넣어서 발행한다", () => {
    const 쿠팡제휴문구 =
      "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";
    cy.get("#boardTitle").type("보드 제목");
    cy.get("#boardCmt").type(
      `보드설명
      👇
      👇
      ${쿠팡제휴문구}`
    );

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
    ).type("https://link.coupang.com/a/LMJfl");

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
  });
});
