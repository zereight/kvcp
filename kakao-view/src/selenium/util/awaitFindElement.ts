import { By, until, WebDriver, WebElementPromise } from "selenium-webdriver";

export const awaitFindElement = async (props: {
  driver: WebDriver;
  selector: string;
  delay?: number;
}) => {
  const { driver, selector, delay = 5000 } = props;

  // 찾을때까지 기다린다.
  await driver.wait(until.elementLocated(By.css(selector)), delay);
  await driver.wait(
    until.elementIsVisible(await driver.findElement(By.css(selector))),
    delay
  );

  // 찾은 결과를 반환한다
  return await driver.findElement(By.css(selector));
};
