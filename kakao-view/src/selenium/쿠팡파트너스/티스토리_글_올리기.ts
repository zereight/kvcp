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
import { awaitFindElement } from "../util/awaitFindElement.js";
import 쿠팡파트너스_물품들 from "./결과물/쿠팡_파트너스_크롤링한거.json" assert { type: "json" };

const 랜딩용_티스토리_관리페이지 =
  "https://woowacourse-darass.tistory.com/manage";

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

    const chrome = new Builder().withCapabilities(options).forBrowser("chrome");

    const driver = await chrome.build();

    await driver.get(랜딩용_티스토리_관리페이지);

    // 로그인할 시간만큼 기다린다.
    await driver.sleep(20000);

    for (const 상품 of 쿠팡파트너스_물품들) {
      const 글쓰기버튼 = await awaitFindElement({
        driver,
        selector:
          "#kakaoHead > div > div.info_tistory > div > a.btn_tistory.btn_log_info",
      });
      await 글쓰기버튼.sendKeys(Key.ENTER);

      try {
        // 얼럿처리
        await driver.wait(until.alertIsPresent());
        const alert = await driver.switchTo().alert();
        await alert.dismiss();
      } catch (error) {}
      await driver.sleep(2000);

      //   const 입력모드버튼 = await awaitFindElement({
      //     driver,
      //     selector: "#editor-mode-layer-btn-open",
      //   });
      //   await 입력모드버튼.sendKeys(Key.ENTER);
      //   const HTML버튼 = await awaitFindElement({
      //     driver,
      //     selector: "#editor-mode-html",
      //   });
      //   await driver.sleep(1000);
      //   await HTML버튼.sendKeys(Key.ENTER);
      //   await driver.sleep(1000);

      const 제목입력창 = await awaitFindElement({
        driver,
        selector: "#post-title-inp",
      });
      await 제목입력창.sendKeys(`${new Date().toDateString()}-${상품.name}`);
      await driver.sleep(2000);

      const iframe = await awaitFindElement({
        driver,
        selector: "#editor-tistory_ifr",
      });
      await driver.switchTo().frame(iframe);

      const 본문입력창 = await awaitFindElement({
        driver,
        selector: "#tinymce",
      });

      await 본문입력창.sendKeys(`<p>[##_Image|kage@LBHOj/btrXBZb9KiH/DFUDK2gHXlA0hT9JubOQZ1/img.jpg|CDM|1.3|{"originWidth":212,"originHeight":212,"style":"alignCenter"}_##]</p>`);
      await 본문입력창.sendKeys(상품.landingPageHtml);

      await driver.sleep(2000);
      await driver.switchTo().defaultContent();

      // HTML에 붙여넣으세요
      await driver.sleep(5000);

      const 완료버튼 = await awaitFindElement({
        driver,
        selector: "#publish-layer-btn",
      });
      await 완료버튼.sendKeys(Key.ENTER);
      await driver.sleep(2000);

      const 공개발행버튼 = await awaitFindElement({
        driver,
        selector: "#publish-btn",
      });
      await 공개발행버튼.sendKeys(Key.ENTER);
      await driver.sleep(2000);
      break;
    }

    // fs.writeFile(
    //   "./src/selenium/쿠팡파트너스/결과물/쿠팡_파트너스_크롤링한거.json",
    //   JSON.stringify(크롤링결과),
    //   (err) => {
    //     if (err) {
    //       console.error(err);
    //       return;
    //     }
    //     console.log("파일생성완료");
    //   }
    // );
  } catch (error) {
    console.error(error);
  }
};

실행하기();
