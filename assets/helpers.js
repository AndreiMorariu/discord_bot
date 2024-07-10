import { createCanvas, loadImage } from "canvas";

export function groupBy(arr, keySelector) {
  const map = {};

  arr.map((element) => {
    const key = keySelector(element);
    if (key === undefined) throw "undefined key!";

    map[key] = map[key] || [];
    map[key].push(element);
  });

  return map;
}

export async function resizeImage(url, width, height) {
  const img = await loadImage(url);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toBuffer();
}
