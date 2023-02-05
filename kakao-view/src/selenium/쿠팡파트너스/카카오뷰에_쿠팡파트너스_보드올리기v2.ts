import {
  Builder,
  By,
  Key,
  until,
  WebDriver,
  Actions,
  WebElement,
} from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome.js";
import { Time } from "../constants/Time.js";
import { awaitFindElement } from "../util/awaitFindElement.js";

import {
  카카오뷰_로그인하기,
  카카오뷰_보드_정보입력하고_발행하기,
  카카오뷰_채널선택하여_접속하기,
} from "../util/카카오뷰_보드올리기.js";

import 쿠팡파트너스_물품들 from "./결과물/쿠팡_파트너스_크롤링한거.json" assert { type: "json" };
import 카카오뷰_계정_채널명 from "../개인정보/카카오뷰_계정_채널명.json" assert { type: "json" };

// TODO: 카카오계정과 채널을 코드에서 분리시킨다
// TODO: 채널을 선택하면, 같은 카카오계정내의 채널에 대해서 같은 데이터를 예약한다
// TODO: 쿠팡파트너스 링크를 넣는것은 유지하되, 랜딩페이지를 만드는 것은, 수동으로 입력하게 한다. (티스토리로)
// TODO: 데이터형식도 바꿔야할듯

const 내_채널들 = Object.values(카카오뷰_계정_채널명)
  .map((계정) => {
    return 계정.채널들;
  })
  .flat();

const 내_채널_및_시간대: Record<string, keyof typeof Time> = {
  // 아침
  "리빙피쉬(쇼핑)": "아침",
  "쇼핑은 진심이다": "아침",
  "내 장바구니": "아침",
  // 점심
  쇼핑의고수: "점심",
  "내가바로 김쇼핑": "점심",
  쇼비욕구: "점심",
  // 저녁
  쇼핑장인: "저녁",
  월급킬러: "저녁",
  // 밤
  쇼핑혁: "밤",
  "언니들 이거봐바": "밤",
} as const;

//! 발행하려는 채널명
// const targetChannels: typeof 내_채널들[number][] = [
//   "리빙피쉬(쇼핑)", // 본계정
//   "쇼핑의고수", // 본계정
//   "쇼핑장인", // 본계정
//   "쇼핑혁", // 본계정
//   "쇼핑은 진심이다", // 본계정
// ];
const targetChannels: typeof 내_채널들[number][] = [
  "내가바로 김쇼핑",
  "월급킬러",
  "언니들 이거봐바",
  "내 장바구니",
  "쇼비욕구",
];

const 등록하려는_날짜 = 1;

const 로그인을_몇초_기다릴까요 = 20;

// ! 실행하기
const 실행하기 = async () => {
  const options = new Options();
  options.addArguments(
    "user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
  );
  options.addArguments("Accept-Language=ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7");
  options.addArguments("Accept-Encoding=gzip,deflate");
  options.addArguments("--no-sandbox");
  options.addArguments("disable-gpu");
  options.addArguments("--lang=ko_KR");
  options.addArguments("--disable-blink-features=AutomationControlled");
  options.addArguments("--disable-extensions");
  options.addArguments("useAutomationExtension=false");

  const chrome = new Builder().withCapabilities(options).forBrowser("chrome");

  let driver = await chrome.build();

  try {
    await 카카오뷰_로그인하기(driver);

    //  로그인을 기다림
    await driver.sleep(로그인을_몇초_기다릴까요 * 1000);

    for (const targetChannel of targetChannels) {
      await driver.sleep(1000);

      await 카카오뷰_채널선택하여_접속하기({
        targetChannel,
        driver,
      });

      await driver.sleep(1000);

      for (const 물품 of 쿠팡파트너스_물품들.slice(0, 10)) {
        await driver.sleep(200);

        // 보드탭 클릭
        (
          await awaitFindElement({
            driver,
            selector:
              "#root > div.container-doc > main > section > aside > nav > ul > li:nth-child(2) > a > span",
          })
        ).click();

        // 새 보드 발행 클릭
        (
          await awaitFindElement({
            driver,
            selector: "#mainContent > div.wrap_tit > div > a > span",
          })
        ).click();

        const { landingPageLink, name } = 물품;

        await 카카오뷰_보드_정보입력하고_발행하기({
          driver,
          보드제목: name,
          보드설명: name,
          보드유형: 3,
          링크: landingPageLink,
          카테고리1: "쇼핑 정보",
          카테고리2: "리빙",
          예약발행날짜: 등록하려는_날짜,
          예약발행시간: Time[내_채널_및_시간대[targetChannel]].시,
          예약발행분: Time[내_채널_및_시간대[targetChannel]].분,
        });
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    console.log("종료");
    // driver.quit();
  }
};

실행하기();

/**
 * 
 <button style="--lt-color-gray-100: #f8f9fc; --lt-color-gray-200: #f1f3f9; --lt-color-gray-300: #dee3ed; --lt-color-gray-400: #c2c9d6; --lt-color-gray-500: #8f96a3; --lt-color-gray-600: #5e636e; --lt-color-gray-700: #2f3237; --lt-color-gray-800: #1d1e20; --lt-color-gray-900: #111213; --lt-shadowdefault: 0 2px 6px -1px rgba(0, 0, 0, 0.16), 0 1px 4px -1px rgba(0, 0, 0, 0.04); --lt-shadowactive: 0 0 8px -2px rgba(0, 0, 0, 0.1), 0 6px 20px -3px rgba(0, 0, 0, 0.2); --lt-color-white: #fff  !important; --lt-color-black: #111213  !important; --lt-color-transparent: rgba(255, 255, 255, 0)  !important; --lt-color-background-light: var(--lt-color-gray-100)  !important; --lt-color-background-default: var(--lt-color-gray-200)  !important; --lt-color-background-dark: var(--lt-color-gray-300)  !important; --lt-color-border-light: var(--lt-color-gray-200)  !important; --lt-color-border-default: var(--lt-color-gray-300)  !important; --lt-color-border-dark: var(--lt-color-gray-400)  !important; --lt-color-text-very-light: var(--lt-color-gray-500)  !important; --lt-color-text-light: var(--lt-color-gray-600)  !important; --lt-color-text-default: var(--lt-color-gray-700)  !important; --lt-color-text-dark: var(--lt-color-gray-800)  !important; --lt-color-overlay-default: #fff  !important; --lt-color-overlay-dark: #fff  !important; --lt-color-overlay-transparent: rgba(0, 0, 0, 0.1)  !important; --lt-shadow-website-overlay: 0 0 7px 0 rgba(0, 0, 0, 0.3)  !important; --scrollbar-width: 15px; -webkit-text-size-adjust: none; font: inherit; background: none; font-family: roboto,Noto Sans KR,-apple-system,dotum,sans-serif; margin: 0; transition-property: background-color,border-color,color,opacity; transition-duration: .15s; border: 1px solid #cdd3d8; border-radius: 4px; cursor: pointer; vertical-align: middle; text-decoration: none; white-space: nowrap; font-weight: 500; box-sizing: border-box!important; -webkit-appearance: none; -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent; padding: 14px 28px; line-height: 1.4; font-size: 18px; display: block; width: 100%; border-color: #00c4c4; background-color: #00c4c4; color: #fff; position: abosolute; bottom: 10;" type="button" onclick="window.location.href='https://link.coupang.com/a/NMGKl'"><span>구매하기</span></button></p>
 */
