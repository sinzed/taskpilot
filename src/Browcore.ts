import { Browser, Page } from "puppeteer";
import fs from 'fs';

import puppeteer from "puppeteer-extra";
import pluginStealth from "puppeteer-extra-plugin-stealth";
const stealthPlugin = pluginStealth();
stealthPlugin.enabledEvasions.delete('iframe.contentWindow');
stealthPlugin.enabledEvasions.delete('media.codecs')
puppeteer.use(stealthPlugin)

export class Browcore {
  waitForTimeout(timeOut: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, timeOut);
    });
  }
  public page!: Page;
  public browser: Browser | null = null;
  public headless = false;

  async init() {
    // const executablePath = findChrome().pop() || null;
    this.browser = await puppeteer.launch({
      devtools: false,
      headless: this.headless,
      ignoreHTTPSErrors: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        // '--disable-features=IsolateOrigins,site-per-process',
      ],
      userDataDir: 'data/puppsession', // Persist the session.
      // userDataDir: 'data/Meditube', // Persist the session.
      // userDataDir: 'data/userdata', // Persist the session.
      handleSIGINT: false,
      // args: [
      //   // '--log-level=3', // fatal only
      //   // //'--start-maximized',
      //   // '--no-default-browser-check',
      //   // '--disable-infobars',
      //   // '--disable-web-security',
      //   // '--disable-site-isolation-trials',
      //   // '--no-experiments',
      //   '--ignore-gpu-blacklist',
      //   // '--ignore-certificate-errors',
      //   // '--ignore-certificate-errors-spki-list',
      //   // '--disable-gpu',
      //   '--disable-extensions',
      //   // '--disable-default-apps',
      //   // '--enable-features=NetworkService',
      //   // '--disable-setuid-sandbox',
      //   // '--no-sandbox',
      //   // '--window-size=1200,800'
      // ],
      ignoreDefaultArgs: ['--enable-automation'],

    });

    await this.reinitPage();
    // close browser on exit
    process.on('SIGINT', async () => {
      if (!this.browser)
        return false
      this.browser
        .close()
        .then(() => process.exit(0))
        .catch(() => process.exit(0))
    }
    )

    // await this.loadCookies(this.page)

  }

  public async reinitPage() {
    if (!this.browser)
      return;
    this.page = await this.browser.newPage();
    this.page.setDefaultNavigationTimeout(0);
    await this.page.setExtraHTTPHeaders({ 'Cookie': 'SetCurrency=EUR; lang=it_IT' });
    // await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
    await this.page.setViewport({ width: 1200, height: 735 });
    await this.page.setRequestInterception(true);



    this.page.on('request', (request: { continue: () => void; }) => {
      request.continue();
    });
    this.page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  }

  async loadCookies(page: { setCookie: (arg0: any) => any; }) {
    // If file exist load the cookies
    if (fs.existsSync("./cookies.json")) {
      const cookiesArr = require(`.${"./cookies.json"}`)
      if (cookiesArr.length !== 0) {
        for (let cookie of cookiesArr) {
          await page.setCookie(cookie)
        }
        console.log('Session has been loaded in the browser!')
        return true
      }
    }
  }
  async saveCookie() {
    const cookies = await this.page.cookies();
    await fs.writeFileSync('./cookies.json', JSON.stringify(cookies, null, 2));
  }
  async loadLocalStorage() {
    if (fs.existsSync("./local-storage.json")) {
      const localStorage = fs.readFileSync("./local-storage.json").toJSON()
      await this.page.evaluate(() => {
        window.localStorage.clear();
        for (let key in localStorage) {
          window.localStorage.setItem(key, '323');
        }
      });

      return true;
    }
    return false;
  }

  async saveLocalstorage() {
    const localStorage = await this.page.evaluate(() => Object.assign({}, window.localStorage));
    fs.writeFileSync('./local-storage.json', JSON.stringify(localStorage, null, 2));
  }

  async writeCookies(page: Page, cookiesPath = "./cookies.json") {
    const client = await page.target().createCDPSession();
    // This gets all cookies from all URLs, not just the current URL
    const allCookies = await client.send("Network.getAllCookies") as unknown as any;
    const cookies = allCookies["cookies"];
    // const cookies = (await client.send("Network.getAllCookies"))["cookies"];

    console.log("Saving", cookies.length, "cookies");
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies));
    // await fs.writeJSON(cookiesPath, cookies);
  }
  async restoreCookies(page: Page, cookiesPath = "./cookies.json") {
    try {
      // const cookies = await fs.readJSON(cookiesPath);
      let buf = fs.readFileSync(cookiesPath).toString();
      let cookies = JSON.parse(buf);
      console.log("Loading", cookies.length, "cookies into browser");
      await page.setCookie(...cookies);
    } catch (err) {
      console.log("restore cookie error", err);
    }
  }
}