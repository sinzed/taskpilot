import { GridService } from "./GridService";
import { Step } from "./types/step";
import { OpenAiBrowser } from "./OpenAiBrowser";
import { HelperService } from "./HelperService";

export class TaskManager {
    openAiBrowser = new OpenAiBrowser();
    gridService = new GridService();
    async run() {
        const prompt = "please open browser";
        await this.prepareWorkingDirectory();
        const content = await this.solve(prompt);
        await this.perform(content);
        // const content = await openAiBrowser.generateContent(prompt);
        console.log(content);
    }
    async prepareWorkingDirectory() {
        HelperService.workingDirectory = "./data/grids/";
        if(!HelperService.directoryExists(HelperService.workingDirectory)){
            HelperService.createDirectory(HelperService.workingDirectory);
        }
    }
    perform(content: Step[]) {
        const step = content[0];
        if (step.action === "click") {
            const clickPosition = this.findClickPosition(step)
        }
    }
    findClickPosition(step: Step) {
        step.gridJsonPath = HelperService.workingDirectory + `${step.screenshotPath}.json`;
        this.gridService.createGrids(step);
    }
    async solve(prompt: string): Promise<Array<Step>> {
        const screenshotPath = HelperService.workingDirectory+"screenshot.png"
        await this.gridService.takeScreenshotIfNotExist(screenshotPath)
        await this.openAiBrowser.uploadScreenshot(screenshotPath);
        const completePrompt = 
        `our goal is to use AI to achieve a task in different steps
        the taks is: "${prompt}"
        now please write the steps in the following format:
        {
            
            [
                "action": "click",
                "clickSpot": "where should we click on",
            ]

        }
            the desktop screenshot of the current status has been attached 
        `;
        const result = await this.openAiBrowser.generateContent(completePrompt);

        return JSON.parse(result);
    }

}
