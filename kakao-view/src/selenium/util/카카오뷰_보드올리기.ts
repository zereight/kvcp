import {
  Builder,
  By,
  Key,
  until,
  WebDriver,
  Actions,
  WebElement,
} from "selenium-webdriver";
import { Time } from "../constants/Time";
import { awaitFindElement } from "./awaitfindElement.js";

export const 카카오뷰_로그인하기 = async (driver: WebDriver) => {
  await driver.get("https://creators.kakao.com/");

  // 로그인 버튼 클릭
  (
    await awaitFindElement({
      driver,
      selector: ".link_login",
    })
  ).click();

  // 로그인 하면됩니다. 10초내에 해주세요.
  // 바로 driver.quit하면 꺼지니까 하지마세요.
};

export const 카카오뷰_채널선택하여_접속하기 = async (props: {
  targetChannel: string;
  driver: WebDriver;
}) => {
  const { driver, targetChannel } = props;

  await driver.get("https://creators.kakao.com/my-channels");

  await driver.sleep(1000);

  const 채널들 = await driver.findElements(By.className("tit_channel"));

  console.log(채널들.length);

  for (const 채널 of 채널들) {
    const 채널이름 = await 채널.getText();

    console.log(채널이름, targetChannel);
    if (채널이름 === targetChannel) {
      console.log("해당하는 채널을 찾았습니다.");
      await 채널.click();

      return;
    }
  }

  console.log("해당하는 채널을 찾지못했습니다.");
};

type 보드카테고리 =
  | "실시간 뉴스"
  | "경제"
  | "시선이 담긴 이슈"
  | "취미"
  | "사는 이야기"
  | "커리어"
  | "브랜드 스토리"
  | "지식교양"
  | "스포츠"
  | "오늘 뭐볼까"
  | "연예"
  | "패션 뷰티"
  | "리빙"
  | "건강"
  | "푸드"
  | "테크"
  | "아트"
  | "반려 생활"
  | "유머"
  | "여행"
  | "쇼핑 정보"
  | "교육"
  | "자동차";

export const 카카오뷰_보드_정보입력하고_발행하기 = async (props: {
  driver: WebDriver;
  보드제목: string;
  보드설명: string;
  보드유형: 3;
  링크: string;
  카테고리1: 보드카테고리;
  카테고리2: 보드카테고리;
  예약발행날짜: number;
  예약발행시간: typeof Time[keyof typeof Time]["시"];
  예약발행분: typeof Time[keyof typeof Time]["분"];
}) => {
  const {
    driver,
    보드제목,
    보드설명,
    링크,
    카테고리1,
    카테고리2,
    예약발행날짜,
    예약발행시간,
    예약발행분,
  } = props;

  // 기본 정보 입력
  (
    await awaitFindElement({
      driver,
      selector: "#boardTitle",
    })
  ).sendKeys(`${보드제목}`);
  (
    await awaitFindElement({
      driver,
      selector: "#boardCmt",
    })
  ).sendKeys(
    `${보드설명}\n\n> 현재 가장 많이 팔리고 있는 제품이에요.\n\n \n* 이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.`
  );

  (
    await awaitFindElement({
      driver,
      selector:
        "#mainContent > div.editor_board > div > div.area_editor > div:nth-child(3) > div.edit_template > ul > li:nth-child(3) > button > span",
    })
  ).click();

  // 링크입력
  (
    await awaitFindElement({
      driver,
      selector:
        "#mainContent > div.editor_board > div > div.area_contents > div.tab_g.tab_type2 > ul > li:nth-child(2) > a",
    })
  ).click();
  (
    await awaitFindElement({
      driver,
      selector:
        "#mainContent > div.editor_board > div > div.area_contents > div.cont_tab > form > div.item_form.type_search > div > input",
    })
  ).sendKeys(링크);

  // 링크 검색
  (
    await awaitFindElement({
      driver,
      selector:
        "#mainContent > div.editor_board > div > div.area_contents > div.cont_tab > form > div.item_form.type_search > div > div > button.btn_search",
    })
  ).click();

  // 담기버튼 클릭
  (
    await awaitFindElement({
      driver,
      selector:
        "#mainContent > div.editor_board > div > div.area_contents > div.cont_tab > form > div.view_contents > ul > li > div.wrap_util > button",
    })
  ).click();

  // 발행팝업 뜨는 버튼 클릭
  (
    await awaitFindElement({
      driver,
      selector:
        "#mainContent > div.wrap_btn > div.align_r > button.btn_g.btn_primary.btn_icon",
    })
  ).click();

  const 발행팝업 = await awaitFindElement({
    driver,
    selector: "#layer > div > div",
  });

  // 카테고리 선택
  const 카테고리들 = await 발행팝업.findElements(By.className("item_choice"));

  for (const 카테고리 of 카테고리들) {
    const 카테고리Text = await 카테고리.getText();
    if (카테고리Text === 카테고리1 || 카테고리Text === 카테고리2) {
      await 카테고리.click();

      break;
    }
  }

  // 예약날짜 선택

  // 예약 라디오 버튼 클릭
  (
    await awaitFindElement({
      driver,
      selector:
        "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(2) > label > span.ico_creators.ico_radio",
    })
  ).click();

  // 시간고르기 선택

  (
    await awaitFindElement({
      driver,
      selector:
        "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(5) > div > a",
    })
  ).click();

  const 시간고르기_리스트 = await 발행팝업.findElements(
    By.css(
      "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(5) > div > div > ul > li"
    )
  );

  for (const 시간고르기 of 시간고르기_리스트) {
    const 시간고르기Text = await 시간고르기.getText();
    if (시간고르기Text === 예약발행시간) {
      await 시간고르기.click();

      break;
    }
  }

  // 분고르기 선택
  (
    await awaitFindElement({
      driver,
      selector:
        "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(7) > div > a",
    })
  ).click();

  const 분고르기_리스트 = await 발행팝업.findElements(
    By.css(
      "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div:nth-child(7) > div > div > ul > li"
    )
  );

  for (const 분고르기 of 분고르기_리스트) {
    const 분고르기Text = await 분고르기.getText();
    if (분고르기Text === 예약발행분) {
      await 분고르기.click();

      break;
    }
  }

  // 예약날짜선택
  (
    await awaitFindElement({
      driver,
      selector:
        "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div.item_form.type_calendar > div.DayPickerInput",
    })
  ).click();

  const 날짜들 = await 발행팝업.findElements(
    By.css(
      "#layer > div > div > div.layer_body > div > div:nth-child(2) > dl > dd > div > div.item_form.type_calendar > div.DayPickerInput > div > div > div > div > div.DayPicker-Months > div > div.DayPicker-Body .DayPicker-Day"
    )
  );

  for (const 날짜 of 날짜들) {
    const 날짜Text = await 날짜.getText();
    if (날짜Text === `${예약발행날짜}`) {
      await 날짜.click();

      break;
    }
  }

  // 경제적 지원 문구 선택
  (
    await awaitFindElement({
      driver,
      selector:
        "#layer > div > div > div.layer_body > div > div:nth-child(4) > div > label > span.ico_creators.ico_check",
    })
  ).click();

  // 발행하기 버튼 클릭
  (
    await awaitFindElement({
      driver,
      selector:
        "#layer > div > div > div.layer_body > div > div.wrap_btn.align_r > button.btn_g.btn_primary.btn_icon",
    })
  ).click();

  await driver.sleep(1000);

  // 발행완료 팝업 확인

  (
    await awaitFindElement({
      driver,
      selector: "#layer > div > div > div.layer_foot > div > button",
    })
  ).click();
};
