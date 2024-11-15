import { GridService } from "./GridService";
import { Step } from "./types/step";
import { OpenAiBrowser } from "./OpenAiBrowser";
import { HelperService } from "./HelperService";
import { ScreenShotOptions } from "./types/screenshot-options";
import fs from "fs";
export class TaskManager {
    openAiBrowser = new OpenAiBrowser();
    gridService = new GridService();
    async run() {
        const prompt = "please open browser";
        await this.prepareWorkingDirectory();
        const content = await this.resolve(prompt);
        // const content1 = await this.resolve(prompt);
        // await this.perform();
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
    async resolve(prompt: string): Promise<boolean> {
        const screenshotPath = HelperService.workingDirectory+"screenshot.png"
        const screenshotGriddedPath = HelperService.workingDirectory+"screenshot_gridded.png"
        const screenShotOptions: ScreenShotOptions = {
            screenshotPath,
            gridSize: 10,
            outputJsonPath: screenshotPath+".json",
            outputGriddedPath: screenshotGriddedPath
        }
        const result = await this.takeScreenshotAndAsk(screenShotOptions, screenshotGriddedPath, prompt);
        const parsedJson :{cells: number[]} = JSON.parse(result);
        const screenshotPath2 = HelperService.workingDirectory+"screenshot2.png"
        const screenshotGriddedPath2 = HelperService.workingDirectory+"screenshot_gridded2.png"
        const cellsToTextract = this.getCellsToExtract(parsedJson.cells, screenShotOptions.outputJsonPath );
        const nextScreenShotOptions: ScreenShotOptions = {
            cellsToExtract: cellsToTextract,
            inputJsonPath: screenShotOptions.outputJsonPath,
            inputScreenshotPath: screenShotOptions.screenshotPath,
            screenshotPath: screenshotPath2,
            gridSize: 5,
            outputJsonPath: screenshotPath2+".json",
            outputGriddedPath: screenshotGriddedPath2
        }
        const result2 = await this.takeScreenshotAndAsk(nextScreenShotOptions, screenshotGriddedPath2, prompt);
        console.log(result2);
        return true;
    }
    getCellsToExtract(cells: number[], cellsJsonpath: string): number[] {
        const jsonText = fs.readFileSync(cellsJsonpath);
        const grid = JSON.parse(jsonText.toString());
        const cellsToExtract: number[] = [];
        // extract all neighbours to cells
        cells.forEach((cell) => {
            const neighbours = this.getNeighbours(cell, grid);
            console.log(neighbours);
            cellsToExtract.push(cell);
            neighbours.forEach((neighbour) => {
                if(!cellsToExtract.includes(neighbour)){
                    cellsToExtract.push(neighbour);
                }
            })
        });
        return cellsToExtract;
    }
    getNeighbours(cell: number, grid: any) {
        const neighbours: number[] = [];
        const row = Math.floor(cell/grid.length);
        const col = cell%grid.length;
        if(row > 0){
            neighbours.push(grid[row-1][col]);
        }
        if(row < grid.length-1){
            neighbours.push(grid[row+1][col]);
        }
        if(col > 0){
            neighbours.push(grid[row][col-1]);
        }
        if(col < grid.length-1){
            neighbours.push(grid[row][col+1]);
        }
        return neighbours;
    }

    private async takeScreenshotAndAsk(screenShotOptions: ScreenShotOptions, screenshotGriddedPath: string, prompt: string):Promise<string> {
        await this.gridService.takeScreenshotIfNotExist(screenShotOptions);
        await this.openAiBrowser.uploadScreenshot(screenshotGriddedPath);
        const completePrompt = `   our goal is to use AI to achieve a task
            the taks is: "${prompt}"
            in each step I will provide a screenshot and ask you for the cells we should click on
            now please write the cells we should click on in the following format:
            {
                cells: [1, 2, 3, 4,...]
            }
            after clicking on the right place I will ask you for the next step
            the desktop screenshot of the current status has been attached 
        `;
        const result = await this.openAiBrowser.generateContent(completePrompt);
        return result;
    }

    async solve(prompt: string): Promise<Array<Step>> {
        const screenshotPath = HelperService.workingDirectory+"screenshot.png"
        const screenShotOptions: ScreenShotOptions = {
            screenshotPath,
            gridSize: 10,
            outputJsonPath: screenshotPath+".json",
            outputGriddedPath: screenshotPath
        }
        await this.gridService.takeScreenshotIfNotExist(screenShotOptions)
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
