/// <reference types="cypress" />;

import 쿠팡파트너스_계정 from "../../../fixtures/개인정보/쿠팡파트너스_계정.private.json";

/**
 * 쿠팡파트너스 로그인 페이지를 이렇게 해야함 ㄷ.ㄷ
 * 매일 링크를 갈아주자
 */

/**
 * 쿠팡파트너스에 로그인이 안된다면 새로 켜주세요.
 * 로그인이 되어있다면 넘어가셔도 됩니다.
 */

const 쿠팡파트너스_로그인_URL =
  "https://login.coupang.com/login/login.pang?rtnUrl=https%3A%2F%2Fpartners.coupang.com%2Fapi%2Fv1%2Fpostlogin%3Fs%3DKrp1Cmu6a0AiR7MaKk3qMZjOXvhDBNK38QktWhig0fPeV2wjZK9rHbzRtG%252BoIckb3E2MtKfddSFdeRWS4NRbJjMOSCp%252FH0Bi45gOZbFViooclVTO13mhfzgLCZUgM1Uy2pum%252FHA%253D";

describe("2. 쿠팡 파트너스 로그인", () => {
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
        // 쿠팡파트너스 계정 입력
        cy.get("#login-email-input").type(쿠팡파트너스_계정.email);
        cy.get("#login-password-input").type(쿠팡파트너스_계정.pw);

        cy.wait(1000);

        // 쿠팡 파트너스 로그인
        cy.get(
          "body > div.member-wrapper.member-wrapper--flex > div > div > form > div.login__content.login__content--trigger > button"
        ).click();
      }
    });

    cy.wait(1000);
  });
});
