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

    const games = await page.$$eval(".search_result_row", (rows) => {
      return rows.map((row) => {
        const title = row.querySelector(".title").textContent;
        const priceElement = row.querySelector(".discount_final_price");
        const price = priceElement ? priceElement.textContent : "Unknown";
        const date =
          row.querySelector(".search_released").textContent.trim() || "Unknown";
        const image = row.querySelector("img").src;
        const link = row.href;
        return { title, price, date, image, link };
      });
    });

    result.push(...games);

    await browser.close();
  } catch (error) {
    console.log(error);
  }

  return result;
}
