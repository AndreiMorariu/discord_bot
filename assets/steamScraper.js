import puppeteer from "puppeteer";

export default async function () {
  let result = [];

  try {
    const browser = await puppeteer.launch();

    const page = await browser.newPage();

    await page.goto(
      "https://store.steampowered.com//search/?filter=popularwishlist&os=win"
    );

    await page.waitForSelector("#search_results");

    const titles = await page.$$(".title");
    const images = await page.$$(".search_capsule > img");
    const dates = await page.$$(".search_released");
    const prices = await page.$$(".discount_final_price");
    const links = await page.$$(".search_result_row");

    for (let i = 0; i < titles.length; i++) {
      const titleElement = titles[i];
      const imageElement = images[i];
      const dateElement = dates[i];
      const priceElement = prices[i];
      const linkElement = links[i];

      const title = await page.evaluate(
        (titleElement) => titleElement.textContent,
        titleElement
      );

      const price = priceElement
        ? await page.evaluate(
            (priceElement) => priceElement.textContent,
            priceElement
          )
        : "Unknown";

      const date = dateElement
        ? await page.evaluate(
            (dateElement) => dateElement.textContent,
            dateElement
          )
        : "Unknown";

      const image = await page.evaluate(
        (imageElement) => imageElement.src,
        imageElement
      );

      const link = await page.evaluate(
        (linkElement) => linkElement.href,
        linkElement
      );

      result.push({ title, date, image, price, link });
    }

    await browser.close();
  } catch (error) {
    console.log(error);
  }

  return result;
}
