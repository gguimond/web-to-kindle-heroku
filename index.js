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
    try{
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setViewport({ width: 600, height: 800 });
      await page.goto(process.env.SCREENSHOT_URL || 'https://www.lameteoagricole.net/meteo-heure-par-heure/Caen-14000-j1.html');
      await page.evaluate(() => {
        if(document.querySelector("#banner")){
          document.querySelector("#banner").remove()
        }
        if(document.querySelector(".frame-content")){
          document.querySelector(".frame-content > div:nth-child(1)").style.background = "none"
        }
        const t = document.querySelector(".bootstrap-table")
        if(t){
          document.body.appendChild(t)
        }
        for (const child of document.body.children) {
          if(child !== t){
            document.body.removeChild(child)
          }
        }
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
    }
    catch(e){
      console.log(e)
    }
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
