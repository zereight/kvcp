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

const 내_채널들 = [
  // 본계정
  "리빙피쉬(쇼핑)", // 본계정
  "쇼핑의고수", // 본계정
  "쇼핑장인", // 본계정
  "쇼핑혁", // 본계정
  "쇼핑은 진심이다", // 본계정

  // 부계정(simple)
  "내가바로 김쇼핑",
  "월급킬러",
  "언니들 이거봐바",
  "내 장바구니",
  "쇼비욕구",
] as const;

const 내_채널_및_시간대: Record<typeof 내_채널들[number], keyof typeof Time> = {
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
const targetChannels: typeof 내_채널들[number][] = [
  "리빙피쉬(쇼핑)", // 본계정
  "쇼핑의고수", // 본계정
  "쇼핑장인", // 본계정
  "쇼핑혁", // 본계정
  "쇼핑은 진심이다", // 본계정
];

const 등록하려는_날짜 = 28;

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

    // QR코드 로그인을 기다림
    await driver.sleep(20000);

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

        const { partnersLink, title } = 물품;

        await 카카오뷰_보드_정보입력하고_발행하기({
          driver,
          보드제목: title,
          보드설명: title,
          보드유형: 3,
          링크: partnersLink,
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
