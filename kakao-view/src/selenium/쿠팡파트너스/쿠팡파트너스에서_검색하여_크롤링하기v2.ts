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

import 쿠팡파트너스계정 from "../개인정보/쿠팡_파트너스_계정.private.json" assert { type: "json" };

import fs from "fs";
import {
  awaitFindElement,
  awaitFindElements,
} from "../util/awaitFindElement.js";
import { CrawledProduct } from "../types/CrawledProduct";
import 티스토리_html템플릿만들기 from "../util/티스토리_html템플릿만들기.js";

const 검색어 = "탈모샴푸";
const 검색결과중_몇번째_상품부터_크롤링할지 = 4;

const 로켓배송_선택하기 = true;

const 쿠팡파트너스페이지 = "https://partners.coupang.com/#affiliate/ws";

const 쿠팡파트너스_로그인하기 = async (driver: WebDriver) => {
  await driver.get(쿠팡파트너스페이지);
  await driver.sleep(2000);

  await (
    await awaitFindElement({
      driver,
      selector: "#login-email-input",
    })
  ).sendKeys(쿠팡파트너스계정.email);

  await (
    await awaitFindElement({
      driver,
      selector: "#login-password-input",
    })
  ).sendKeys(쿠팡파트너스계정.pw);

  const 로그인버튼 = await awaitFindElement({
    driver,
    selector:
      "body > div.member-wrapper.member-wrapper--flex > div > div > form > div.login__content.login__content--trigger > button",
  });
  await 로그인버튼.click();

  await driver.sleep(5000);
};

const 쿠팡파트너스_검색하기 = async (driver: WebDriver) => {
  await driver.sleep(1000);

  const 쿠팡파트너스_메인_검색어입력창 = await awaitFindElement({
    driver,
    selector:
      "#root > div > div > div.workspace-container > div > div > div.affiliate-page > div > div > div.ant-spin-nested-loading.page-spin-container > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div > div > span > input",
  });

  await 쿠팡파트너스_메인_검색어입력창.sendKeys(검색어);

  const 쿠팡파트너스_메인_검색어검색버튼 = await awaitFindElement({
    driver,
    selector:
      "#root > div > div > div.workspace-container > div > div > div.affiliate-page > div > div > div.ant-spin-nested-loading.page-spin-container > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div > div > span > span.ant-input-suffix > button",
  });

  await 쿠팡파트너스_메인_검색어검색버튼.click();

  await driver.sleep(2000);

  if (로켓배송_선택하기) {
    // 검색결과에 대해서 로켓배송만보기

    const 로켓배송_버튼 = await awaitFindElement({
      driver,
      selector:
        "#root > div > div > div.workspace-container > div > div > div.affiliate-page > div > div > div.ant-spin-nested-loading.page-spin-container > div > div > div > div > div > div > section.section-product-list > div > div.search-result-header > div > div.ant-col.delivery-filter.ant-col-xs-24.ant-col-sm-12.ant-col-md-12.ant-col-lg-12 > label:nth-child(1)",
    });

    await 로켓배송_버튼.click();

    await driver.sleep(2000);
  }
};

const 검색어결과_크롤링하기 = async (driver: WebDriver) => {
  const newProductsList: CrawledProduct[] = [];

  for (let i = 0; i < 검색결과중_몇번째_상품부터_크롤링할지; i++) {
    const 검색결과_상품목록 = await awaitFindElements({
      driver,
      selector: ".product-item",
    });

    const 상품명 = (
      await (
        await awaitFindElement({
          driver,
          target: 검색결과_상품목록[i],
          selector: ".LinesEllipsis",
        })
      ).getText()
    )
      .trim()
      .replace("…", "");
    console.log("상품명", 상품명, "에 대해서 작업을 시작합니다.");

    console.log("링크따는 작업을 실행합니다.");

    const 썸네일_링크 = await (
      await awaitFindElement({
        driver,
        target: 검색결과_상품목록[i],
        selector: "div.product-picture > img",
      })
    ).getAttribute("src");

    const action = driver.actions();

    await action
      .move({
        x: 0,
        y: 0,
        origin: 검색결과_상품목록[i],
        duration: 1000,
      })
      .perform();

    await driver.sleep(1000);

    await (
      await awaitFindElement({
        driver,
        target: 검색결과_상품목록[i],
        selector: "button.ant-btn.hover-btn.btn-generate-link",
      })
    ).sendKeys(Key.ENTER);
    console.log("링크생성 버튼을 눌렀습니다.");

    await driver.sleep(2000);

    const 파트너스_링크 = await (
      await awaitFindElement({
        driver,
        selector:
          "#root > div > div > div.workspace-container > div > div > div.affiliate-page > div > div > div.ant-spin-nested-loading.page-spin-container > div > div > div.cp-row.bg-grey > div > div > div > section > section:nth-child(1) > div > div > div.unselectable-input.shorten-url-input.large",
      })
    ).getText();

    // 새로운 상품을 추가합니다.
    const newProduct: CrawledProduct = {
      index: i + 1,
      name: 상품명,
      partnersLink: 파트너스_링크,
      thumbnailUrl: 썸네일_링크,
      landingPageLink: "",
      landingPageHtml: 티스토리_html템플릿만들기({
        썸네일URL: 썸네일_링크,
        파트너스URL: 파트너스_링크,
      }),
    };
    console.log(
      "상품이 추가되었습니다,",
      JSON.stringify(newProduct, undefined, 2)
    );

    newProductsList.push(newProduct);

    // 뒤로가기
    driver.navigate().back();
    await driver.sleep(2000);
  }

  console.log("검색결과 상품목록", newProductsList);

  return newProductsList;
};

const 실행하기 = async () => {
  try {
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

    // clipboard 권한 허용해놓기
    options.setUserPreferences({
      profile: {
        content_settings: {
          exceptions: {
            clipboard: {
              [쿠팡파트너스페이지]: {
                expiration: "0",
                last_modified: Date.now(),
                model: 0,
                setting: 1,
              },
            },
          },
        },
      },
    });

    const chrome = new Builder().withCapabilities(options).forBrowser("chrome");

    const driver = await chrome.build();

    await 쿠팡파트너스_로그인하기(driver);
    await 쿠팡파트너스_검색하기(driver);
    const 크롤링결과 = await 검색어결과_크롤링하기(driver);

    await driver.sleep(1000);

    fs.writeFile(
      "./src/selenium/쿠팡파트너스/결과물/쿠팡_파트너스_크롤링한거.json",
      JSON.stringify(크롤링결과),
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("파일생성완료");
      }
    );
  } catch (error) {
    console.error(error);
  }
};

실행하기();
