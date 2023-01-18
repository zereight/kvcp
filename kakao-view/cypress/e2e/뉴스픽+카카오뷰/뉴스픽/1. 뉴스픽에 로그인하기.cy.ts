/// <reference types="cypress" />;

import 뉴스픽_파트너스_계정 from "../../../fixtures/개인정보/뉴스픽파트너스계정.private.json";

const 뉴스픽_파트너스_URL = "https://partners.newspic.kr/";

describe("1. 뉴스픽 파트너스에 로그인하기", () => {
  it("뉴스픽 파트너스에 로그인한다.", () => {
    cy.visit(뉴스픽_파트너스_URL);

    // 로그인 버튼 클릭
    cy.get(
      "body > div > main > section.intro01 > div.btn-group.pos-center > div > a.btn.btn-confirm"
    ).click();

    /**
     * 각자의 방법으로 로그인해주기
     * 여기서는 일단 이메일 & 비밀번호로 가입했음
     */
    cy.get(
      "body > div > section > div.section-body.mt-32 > div > div.login-form > form > div:nth-child(1) > div > input"
    ).type(뉴스픽_파트너스_계정.email);
    cy.get(
      "body > div > section > div.section-body.mt-32 > div > div.login-form > form > div.input-group.mt-24 > div > input"
    ).type(뉴스픽_파트너스_계정.pw);

    // 로그인 버튼 클릭
    cy.get(
      "body > div > section > div.section-body.mt-32 > div > div.login-form > form > button"
    ).click();
  });
});
