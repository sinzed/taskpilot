import { ElementHandle } from "puppeteer";
import { Browcore } from "./Browcore";
import { HelperService } from "./HelperService";
import path from "path";

export class OpenAiBrowser {
    alreadyLoggedIn: boolean = true;
    selectedEngine: boolean = false;
    currentNumber: number = 0;
    close() {
        //@ts-ignore
        this.browser.browser.close();
    }
    browserOpened: boolean = false;
    browser!: Browcore;
    firstTime: boolean = true;
    private async initIfNot() {
        if (this.browserOpened) {
            return this.browser;
        }
        this.browser = new Browcore();
        await this.browser.init();
        const context = this.browser?.browser?.defaultBrowserContext();

        // Override permissions for a specific URL
        // if(context){
        //     await context.overridePermissions('https://chatgpt.com/', ['clipboard-read', 'clipboard-write']);
        // }
        await this.browser.restoreCookies(this.browser.page, "./cookies.json");
        await this.browser.page.goto('https://chatgpt.com/');
        await this.browser.page.setBypassCSP(true)

        this.browserOpened = true;
        return this.browser;
    }
    async solve(prompt: string): Promise<string> {
        await this.initIfNot();
        await this.login();
        await this.selectGPTEngine();
        await this.upload();
        await this.typePrompt(prompt);
        return "imageSrc";
    }
    async generateContent(prompt: string): Promise<string> {
        await this.initIfNot();

        prompt = prompt.replace(/(?:\r\n|\r|\n)/g, ' ');
        await this.login();
        // await this.selectGPTEngine();
        await this.browser.page.waitForSelector('#prompt-textarea')
        await this.browser.page.type('#prompt-textarea', prompt);
        // await this.browser.page.evaluate((selector, text) => {
        //     const selectorElement = document?.querySelector(selector)
        //     if(selectorElement){
        //         // @ts-ignore
        //         selectorElement.value = text;
        //     }
        // }, '#prompt-textarea', prompt);
        await this.browser.page.keyboard.press("Enter");
        // await this.browser.page.click('#__next > div.relative.z-0.flex.h-full.w-full.overflow-hidden > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden > main > div.flex.h-full.flex-col.focus-visible\\:outline-0 > div.w-full.md\\:pt-0.dark\\:border-white\\/20.md\\:border-transparent.md\\:dark\\:border-transparent.md\\:w-\\[calc\\(100\\%-\\.5rem\\)\\].juice\\:w-full > div.px-3.text-base.md\\:px-4.m-auto.md\\:px-5.lg\\:px-1.xl\\:px-5 > div > form > div > div.flex.w-full.items-center > div > div > button');
        // await this.browser.page.waitForSelector('#__next > div.relative.z-0.flex.h-full.w-full.overflow-hidden > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden > main > div.flex.h-full.flex-col.focus-visible\:outline-0 > div.md\:pt-0.dark\:border-white\/20.md\:border-transparent.md\:dark\:border-transparent.w-full > div.text-base.px-3.md\:px-4.m-auto.md\:px-5.lg\:px-1.xl\:px-5 > div > form > div > div.flex.w-full.items-center > div > div > button', {timeout: 120000});
        // await this.browser.page.waitForSelector('#__next > div.relative.z-0.flex.h-full.w-full.overflow-hidden > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden > main > div.flex.h-full.flex-col.focus-visible\:outline-0 > div.md\:pt-0.dark\:border-white\/20.md\:border-transparent.md\:dark\:border-transparent.w-full > div.text-base.px-3.md\:px-4.m-auto.md\:px-5.lg\:px-1.xl\:px-5 > div > form > div > div.flex.w-full.items-center > div > div > button', {timeout: 120000});
        // await this.browser.page.click('#__next > div.relative.z-0.flex.h-full.w-full.overflow-hidden > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden > main > div.flex.h-full.flex-col.focus-visible\:outline-0 > div.md\:pt-0.dark\:border-white\/20.md\:border-transparent.md\:dark\:border-transparent.w-full > div.text-base.px-3.md\:px-4.m-auto.md\:px-5.lg\:px-1.xl\:px-5 > div > form > div > div.flex.w-full.items-center > div > div > button');
        
        const copyBtnSelector = "pre button"
        await this.browser.page.waitForSelector(copyBtnSelector,{timeout: 120000});
        const copyBtn = await this.browser.page.$(copyBtnSelector);
        await HelperService.waitForTimeout(40000);
        console.log("clicking copy button");
        await copyBtn?.click();
        const clipboardText = await this.browser.page.evaluate(async () => {
            return navigator.clipboard.readText();
        });
        
        // await HelperService.waitForTimeout(5000);
        console.log("clipboard text",clipboardText);
        await HelperService.waitForTimeout(40000);
        return clipboardText;
    }
    public async upload(){
        await HelperService.waitForTimeout(5000);
        await this.browser.page.waitForSelector('#prompt-textarea');
        const fileInputSelector = 'input[type="file"]'; // Adjust this selector if necessary
        await this.browser.page.waitForSelector(fileInputSelector);
    
        console.log('Uploading file...');
        const filePath = path.resolve(__dirname, './main_screen_screenshot.png');
        console.log("file path",filePath);
        // const filePath = './main_screen_screenshot.png';
    
        // Upload the file
        const input = await this.browser.page.evaluateHandle(()=>{
            return document.querySelector('input[type="file"]');

        }) 
        const inputElement = input.asElement() as unknown as ElementHandle<HTMLInputElement>;

        if(inputElement){
            console.log("input element found");
            await inputElement?.uploadFile(filePath);
        }
        const fileInput = await this.browser.page.$(fileInputSelector);
        await fileInput?.uploadFile(filePath);
    }
    private async login() {
        // return true;
        if(this.alreadyLoggedIn){
            return true;
        }
        await this.browser.page.goto('https://chatgpt.com/');
        await this.browser.page.setBypassCSP(true);
        await HelperService.waitForTimeout(2000);
        const loginBtnSelector = '[data-testid="login-button"]';

        await this.browser.page.waitForSelector(loginBtnSelector);
        await this.browser.page.click(loginBtnSelector);
        const socialBtn = "body > div > main > section > div.login-container > div.social-section > button:nth-child(1)";
        await this.browser.page.waitForSelector(socialBtn);
        await this.browser.page.click(socialBtn);
        this.alreadyLoggedIn = true;
        await this.browser.saveCookie();
        await HelperService.waitForTimeout(20000);

    }

    async makeShape(drawPrompt: string):Promise<string> {
        console.log("make shape");
        await this.initIfNot();
        await HelperService.waitForTimeout(2000);
        await this.login();
        await this.selectGPTEngine();
        await this.typePrompt(drawPrompt);
        this.currentNumber++;
        await this.waitForNthImage(this.currentNumber)
        const imageSrc = await this.browser.page.evaluate((numberOfImages) => {
            const imgs = document.querySelectorAll('div.relative.h-full > img');
            // @ts-ignore
            return imgs[numberOfImages - 1].src;
          }, this.currentNumber);
        await this.browser.page.waitForSelector('div.relative.h-full > img',{timeout: 120000});
        // document.querySelector("#__next > div.relative.z-0.flex.h-full.w-full.overflow-hidden > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden > main > div.flex.h-full.flex-col.focus-visible\\:outline-0 > div.flex-1.overflow-hidden > div > div > div > div > div:nth-child(5) > div > div > div.group\\/conversation-turn.relative.flex.w-full.min-w-0.flex-col.agent-turn > div > div.flex.flex-grow.flex-col.max-w-full > div.grid.gap-2.grid-cols-1.my-1.transition-opacity.duration-300 > div > div > div > div.relative.h-full > img")
        // const imageSrc = await this.browser.page.$eval('div.relative.h-full > img', img => img.src);
        return imageSrc;
    }
    async waitForNthImage(n:number) {
        await this.browser.page.waitForFunction((n) => {
          const imgs = document.querySelectorAll('div.relative.h-full > img');
          return imgs.length >= n;
        }, {timeout: 120000}, n);
      }
    
    private async typePrompt(drawPrompt: string) {
        console.log("waiting for prompt textarea");
        await this.browser.page.waitForSelector('#prompt-textarea');
        await this.browser.page.type('#prompt-textarea', drawPrompt);
        await this.browser.page.keyboard.press("Enter");
        // await this.browser.page.click('#__next > div.relative.z-0.flex.h-full.w-full.overflow-hidden > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden > main > div.flex.h-full.flex-col.focus-visible\\:outline-0 > div.w-full.md\\:pt-0.dark\\:border-white\\/20.md\\:border-transparent.md\\:dark\\:border-transparent.md\\:w-\\[calc\\(100\\%-\\.5rem\\)\\].juice\\:w-full > div.px-3.text-base.md\\:px-4.m-auto.md\\:px-5.lg\\:px-1.xl\\:px-5 > div > form > div > div.flex.w-full.items-center > div > div > button');
    }

    private async selectGPTEngine() {
        return true
        if(this.selectedEngine) return true;
        await this.browser.page.waitForSelector("#__next > div.relative.z-0.flex.h-full.w-full.overflow-hidden > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden > main > div.flex.h-full.flex-col.focus-visible\\:outline-0 > div.flex-1.overflow-hidden > div > div.absolute.left-0.right-0 > div > div.flex.items-center.gap-2.overflow-hidden.juice\\:gap-0", { timeout: 120000 });
        await HelperService.waitForTimeout(3000);
        await this.browser.page.click("#__next > div.relative.z-0.flex.h-full.w-full.overflow-hidden > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden > main > div.flex.h-full.flex-col.focus-visible\\:outline-0 > div.flex-1.overflow-hidden > div > div.absolute.left-0.right-0 > div > div.flex.items-center.gap-2.overflow-hidden.juice\\:gap-0");
        await this.browser.page.keyboard.press('ArrowDown');
        await this.browser.page.keyboard.press('Enter');
        this.selectedEngine = true;
    }
} 