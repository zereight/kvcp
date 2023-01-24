import {
  Builder,
  By,
  Key,
  until,
  WebDriver,
  Actions,
  WebElement,
} from "selenium-webdriver";

import fs from "fs";
import { Options } from "selenium-webdriver/chrome.js";
import 쿠팡파트너스계정 from "./쿠팡_파트너스_계정.private.json" assert { type: "json" };
import { CrawledProducts } from "./types/CrawledProducts";
import { Time } from "./constants/Time";

const 크롤링하고싶은쿠팡페이지 =
  "https://www.coupang.com/np/campaigns/82/components/178613?listSize=60&brand=&offerCondition=&filterType=&isPriceRange=false&minPrice=&maxPrice=&page=1&channel=user&fromComponent=N&selectedPlpKeepFilter=&sorter=saleCountDesc&filter=&component=178613&rating=0";

const 쿠팡파트너스페이지 = "https://partners.coupang.com/#affiliate/ws";

// ! 쿠팡크롤링하기
const 쿠팡크롤링하기 = async (driver: WebDriver) => {
  await driver.get(크롤링하고싶은쿠팡페이지);
  await driver.sleep(2000);

  // 상품리스크 크롤링
  const 상품정보Elements = await driver.findElements(
    By.className("baby-product")
  );

  const 상품명_리스트: string[] = [];
  // 상품명 가져오기
  for (const 상품정보Element of 상품정보Elements) {
    const 상품명 = await 상품정보Element
      .findElement(By.className("name"))
      .getText();

    상품명_리스트.push(상품명.trim());
  }

  return 상품명_리스트;
};

// ! 쿠팡파트너스_로그인하기
const 쿠팡파트너스_로그인하기 = async (driver: WebDriver) => {
  await driver.get(쿠팡파트너스페이지);
  await driver.sleep(2000);

  await driver
    .findElement(By.id("login-email-input"))
    .sendKeys(쿠팡파트너스계정.email);

  await driver
    .findElement(By.id("login-password-input"))
    .sendKeys(쿠팡파트너스계정.pw);

  await driver
    .findElement(By.xpath("/html/body/div[1]/div/div/form/div[5]/button"))
    .click();
};

// ! 쿠팡크롤링한거_파트너스링크_저장하고_카카오뷰에_저장할_상품정보_반환
const 쿠팡크롤링한거_파트너스링크_저장하고_카카오뷰에_저장할_상품정보_반환 =
  async (props: { 상품명_리스트: string[]; driver: WebDriver }) => {
    const { 상품명_리스트, driver } = props;

    await driver.get(쿠팡파트너스페이지);

    // 여기서 팝업이 뜬다면 수동으로 닫아주기
    await driver.sleep(5000);

    const 카카오뷰에_저장할_상품정보: CrawledProducts[] = [];

    // 모든 상품에 대하여 돌면서 파트너스 링크 가져오기
    let index = 0;
    for (const 상품명 of 상품명_리스트) {
      ++index;
      console.log(`${index}/${상품명_리스트.length} 번째 처리중....`);

      await driver.get(쿠팡파트너스페이지);

      await driver.wait(
        until.elementLocated(
          By.css(
            "#root > div > div > div.workspace-container > div > div > div.affiliate-page > div > div > div.ant-spin-nested-loading.page-spin-container > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div > div > span > input"
          )
        ),
        5000
      );

      // 검색
      await driver
        .findElement(
          By.css(
            "#root > div > div > div.workspace-container > div > div > div.affiliate-page > div > div > div.ant-spin-nested-loading.page-spin-container > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div > div > span > input"
          )
        )
        .sendKeys(encodeURIComponent(상품명));

      await driver
        .findElement(
          By.css(
            "#root > div > div > div.workspace-container > div > div > div.affiliate-page > div > div > div.ant-spin-nested-loading.page-spin-container > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div > div > span > span.ant-input-suffix > button"
          )
        )
        .click();

      await driver.sleep(2000);

      // 검색결과에서 상품명이 같은 아이템 찾기
      const 찾은_검색결과리스트 = await driver.findElements(
        By.className("product-item")
      );

      if (찾은_검색결과리스트.length === 0) {
        console.log("쿠팡파트너스에는 해당 상품이 없습니다.");
        continue;
      }

      // ! 쿠팡파트너스_상품에_마우스올리고_링크생성버튼누르고_링크받아오기
      const 쿠팡파트너스_상품에_마우스올리고_링크생성버튼누르고_링크받아오기 =
        async (검색결과_아이템: WebElement) => {
          // 해당 상품에 마우스 호버
          console.log("같은이름 가진 상품에 마우스 올리기");
          const action = driver.actions();
          action
            .move({
              origin: 검색결과_아이템,
            })
            .perform();

          await driver.sleep(1000);

          await driver.wait(
            until.elementLocated(By.className("btn-generate-link")),
            5000
          );

          await 검색결과_아이템
            .findElement(By.className("btn-generate-link"))
            .click();

          await driver.sleep(3000);
          await driver.wait(
            until.elementLocated(
              By.css(
                "#root > div > div > div.workspace-container > div > div > div.affiliate-page > div > div > div.ant-spin-nested-loading.page-spin-container > div > div > div.cp-row.bg-grey > div > div > div > section > section:nth-child(1) > div > div > div.unselectable-input.shorten-url-input.large"
              )
            ),
            3000
          );

          const 파트너스_링크 = await driver
            .findElement(
              By.css(
                "#root > div > div > div.workspace-container > div > div > div.affiliate-page > div > div > div.ant-spin-nested-loading.page-spin-container > div > div > div.cp-row.bg-grey > div > div > div > section > section:nth-child(1) > div > div > div.unselectable-input.shorten-url-input.large"
              )
            )
            .getText();

          console.log("파트너스링크 가져옴", 파트너스_링크);

          return 파트너스_링크;
        };

      let 현재_보고있는_검색결과_상품 = 찾은_검색결과리스트[0]; // 아무것도 못찾으면 첫번째 링크를 넣기위함

      for (const 검색결과_아이템 of 찾은_검색결과리스트) {
        const 검색결과_아이템_이름 = await 검색결과_아이템.getText();

        if (검색결과_아이템_이름.includes(상품명)) {
          현재_보고있는_검색결과_상품 = 검색결과_아이템;

          break;
        }
      }

      const 파트너스_링크 =
        await 쿠팡파트너스_상품에_마우스올리고_링크생성버튼누르고_링크받아오기(
          현재_보고있는_검색결과_상품
        );

      await driver.sleep(2000);

      // 추가
      const newProductInfo: CrawledProducts = {
        index,
        name: 상품명,
        title: 상품명,
        partnersLink: 파트너스_링크,
      };

      카카오뷰에_저장할_상품정보.push(newProductInfo);

      console.log(
        "카카오뷰에_저장할_상품정보",
        JSON.stringify(카카오뷰에_저장할_상품정보, undefined, 2)
      );

      await driver.sleep(1000);
    }

    return 카카오뷰에_저장할_상품정보;
  };

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
    const 상품명_리스트 = (await 쿠팡크롤링하기(driver)) || [];

    await driver.sleep(1000);

    await 쿠팡파트너스_로그인하기(driver);

    await driver.sleep(1000);

    const 카카오뷰에_저장할_상품정보: CrawledProducts[] =
      await 쿠팡크롤링한거_파트너스링크_저장하고_카카오뷰에_저장할_상품정보_반환(
        {
          driver,
          상품명_리스트,
        }
      );

    await driver.sleep(1000);

    fs.writeFile(
      "./src/selenium/카카오뷰에_저장할_상품정보.json",
      JSON.stringify(카카오뷰에_저장할_상품정보),
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
  } finally {
    driver.quit();
  }
};

실행하기();
