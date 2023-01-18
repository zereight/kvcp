/// <reference types="cypress" />;

const 카카오뷰_창작센터_URL = "https://creators.kakao.com/";

describe("1. 카카오뷰 QR 로그인하기", () => {
  it("카카오뷰 창작센터에 로그인 한다", () => {
    /**
     * * QR 로그인하기
     */
    cy.visit(카카오뷰_창작센터_URL);

    cy.get(".link_login").click();

    cy.get("button").contains("QR코드 로그인").click();

    cy.pause();
  });
});
