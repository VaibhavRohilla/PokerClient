import * as PIXI from "pixi.js";
const maxDimension = 512;


function calculateSize(img:HTMLImageElement)
{
  let width = img.width;
  let height = img.height;

  // calculate the width and height, constraining the proportions
  if (width > height) {
    if (width > maxDimension) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    }
  } else {
    if (height > maxDimension) {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }
  return [width, height];
}


export function GetResizedTexture(imgUrl: string): Promise<PIXI.Texture>
{
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imgUrl;
    img.crossOrigin = "Anonymous";

    img.onload = () => {

      if(img.width > maxDimension || img.height > maxDimension)
      {
        const [width, height] = calculateSize(img);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.drawImage(img, 0, 0, width, height);
        console.log("Resized image: " + width + "x" + height);
        const dataUrl = canvas.toDataURL("image/png");
        const texture = PIXI.Texture.from(dataUrl);
        resolve(texture);
      } else
      {
        const texture = PIXI.Texture.from(imgUrl);
        resolve(texture);
      }
    }
  });
}
