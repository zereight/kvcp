import {
  By,
  until,
  WebDriver,
  WebElement,
  WebElementPromise,
} from "selenium-webdriver";

export const awaitFindElement = async (props: {
  driver: WebDriver;
  selector: string;
  delay?: number;
  target?: WebElement;
}) => {
  const { driver, selector, delay = 5000, target } = props;

  // 찾을때까지 기다린다.
  await driver.wait(until.elementLocated(By.css(selector)), delay);

  if (target) {
    await driver.wait(
      until.elementIsVisible(await target.findElement(By.css(selector))),
      delay
    );

    // 찾은 결과를 반환한다
    return await target.findElement(By.css(selector));
  } else {
    await driver.wait(
      until.elementIsVisible(await driver.findElement(By.css(selector))),
      delay
    );

    // 찾은 결과를 반환한다
    return await driver.findElement(By.css(selector));
  }
};
