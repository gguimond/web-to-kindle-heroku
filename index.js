const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const execFile = require('child_process').execFile;
const fs = require('fs');

const PORT = process.env.PORT || 3000;

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', async (req, res) => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 600, height: 800 });
    await page.goto(process.env.SCREENSHOT_URL || 'https://darksky.net/details/40.7127,-74.0059/2021-1-6/us12/en');
    await page.evaluate(() => {
      if(document.querySelector("#banner")){
        document.querySelector("#banner").remove()
      }
      if(document.querySelector("section:nth-child(1)")){
        document.querySelector("section:nth-child(1)").remove()
      }
      if(document.querySelector("#header")){
        document.querySelector("#header").remove()
      }
      if(document.querySelector("#map-container")){
        document.querySelector("#map-container").remove()
      }
      document.querySelectorAll("#currentDetails > div").forEach(function(item) {
        item.style.margin = '0'
      });
      document.querySelectorAll("#currentDetails .label").forEach(function(item) {
        item.style.margin = '0'
      });
      if(document.querySelector("#week")){
        document.querySelector("#week").style.margin = '-30px 0 0 0'
      }
      if(document.querySelector("#week > .summary")){
        document.querySelector("#week > .summary").style.margin = '5px'
      }
      document.querySelectorAll(".day").forEach(function(item) {
        item.style.margin = '0 auto 12px'
      });
    });
    await page.screenshot({
      path: '/tmp/screenshot.png',
    });

    await browser.close();

    await convert('/tmp/screenshot.png');
    screenshot = fs.readFileSync('/tmp/screenshot.png');

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': screenshot.length,
    });
    return res.end(screenshot);
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));


function convert(filename) {
  return new Promise((resolve, reject) => {
    const args = [filename, '-gravity', 'center', '-extent', '600x800', '-colorspace', 'gray', '-depth', '8', filename];
    execFile('convert', args, (error, stdout, stderr) => {
      if (error) {
        console.error({ error, stdout, stderr });
        reject();
      } else {
        resolve();
      }
    });
  });
}
