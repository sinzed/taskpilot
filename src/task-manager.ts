import { GridService } from "./GridService";
import { Step } from "./types/step";
import { OpenAiBrowser } from "./OpenAiBrowser";
import { HelperService } from "./HelperService";
import { ScreenShotOptions } from "./types/screenshot-options";
import fs from "fs";
import { Cell } from "./types/Cell";
import { ClaudeBrowser } from "./ClaudeBrowser";
export class TaskManager {
    aiBrowser = new ClaudeBrowser();
    gridService = new GridService();
    async run() {
        const prompt = "please open telegram";
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
        console.log(result);  
        const parsedJson :{cells: number[]} = JSON.parse(result);

        const screenshotPath2 = HelperService.workingDirectory+"screenshot2.png"
        const screenshotGriddedPath2 = HelperService.workingDirectory+"screenshot_gridded2.png"
        const cellsToTextract = this.getCellsToExtract(parsedJson.cells, screenShotOptions.outputJsonPath, screenShotOptions.gridSize );
        const screenShotOptions2: ScreenShotOptions = {
            cellsToExtract: cellsToTextract,
            inputJsonPath: screenShotOptions.outputJsonPath,
            inputScreenshotPath: screenShotOptions.screenshotPath,
            screenshotPath: screenshotPath2,
            gridSize: 5,
            outputJsonPath: screenshotPath2+".json",
            outputGriddedPath: screenshotGriddedPath2
        }
        const result2 = await this.takeScreenshotAndAsk(screenShotOptions2, screenshotGriddedPath2, prompt);
        console.log(result2);

        const parsedJson2 :{cells: number[]} = JSON.parse(result2);
        const cellsToTextract2 = this.getCellsToExtract(parsedJson2.cells, screenShotOptions2.outputJsonPath, screenShotOptions2.gridSize );
        const screenShotOptions3: ScreenShotOptions = {
            cellsToExtract: cellsToTextract2,
            inputJsonPath: screenShotOptions2.outputJsonPath,
            inputScreenshotPath: screenShotOptions2.screenshotPath,
            screenshotPath: HelperService.workingDirectory+"screenshot3.png",
            gridSize: 5,
            outputJsonPath: HelperService.workingDirectory+"screenshot3.png.json",
            outputGriddedPath: HelperService.workingDirectory+"screenshot_gridded3.png"
        }
        const result3 = await this.takeScreenshotAndAsk(screenShotOptions3, HelperService.workingDirectory+"screenshot_gridded3.png", prompt);
        console.log(result3);

        return true;
    }
    getCellsToExtract(cells: number[], cellsJsonpath: string, cols: number): number[] {
        const jsonText = fs.readFileSync(cellsJsonpath);
        const grid = JSON.parse(jsonText.toString());
        const cellsToExtract: number[] = [];
        // extract all neighbours to cells
        cells.forEach((cell) => {
            const neighbours = this.getNeighbours(cell, grid, cols);
            console.log("neighbours",neighbours);
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
    getNeighbours(cell: number, grid: Cell[], cols: number): number[] {
        const neighbours: number[] = [];
        const totalCells = grid.length;
        const rows = Math.ceil(totalCells / cols); // Number of rows in the grid
    
        // Helper function to get row and column from cell number
        const getRowCol = (cellNumber: number): { row: number; col: number } | null => {
            if (cellNumber < 1 || cellNumber > totalCells) return null;
            const row = Math.floor((cellNumber - 1) / cols);
            const col = (cellNumber - 1) % cols;
            return { row, col };
        };
    
        // Get the row and column of the target cell
        const position = getRowCol(cell);
        if (!position) return neighbours; // Invalid cell number
    
        const { row, col } = position;
    
        // Define the 8 possible directions (N, NE, E, SE, S, SW, W, NW)
        const directions: Array<[number, number]> = [
            [-1, 0],  // North
            [-1, 1],  // Northeast
            [0, 1],   // East
            [1, 1],   // Southeast
            [1, 0],   // South
            [1, -1],  // Southwest
            [0, -1],  // West
            [-1, -1], // Northwest
        ];
    
        // Iterate through each direction to find valid neighbors
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
    
            // Check if the new position is within grid bounds
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                const neighborCellNumber = newRow * cols + newCol + 1; // +1 because cell numbers start at 1
                // Optional: Verify that the neighbor exists in the grid
                const neighborExists = grid.some(c => c.cell_number === neighborCellNumber);
                if (neighborExists) {
                    neighbours.push(neighborCellNumber);
                }
            }
        }
    
        return neighbours;
    }

    private async takeScreenshotAndAsk(screenShotOptions: ScreenShotOptions, screenshotGriddedPath: string, prompt: string):Promise<string> {
        await this.gridService.takeScreenshotIfNotExist(screenShotOptions);
        await this.aiBrowser.uploadScreenshot(screenshotGriddedPath);
        const completePrompt = `   our goal is to use AI to achieve a task
            the taks is: "${prompt}"
            in each step I will provide a screenshot and ask you for the cells we should click on
            now please, look very carefully at the image the desktop screenshot
             find the cells we should click on in the following format: 
            {
                cells: [1, 2, 3, 4,...] ( the number of cell is written in white on the cell)
            }
            after clicking on the right place I will ask you for the next step
            the desktop screenshot of the current status has been attached 
            can you please just write the json
        `;
        const result = await this.aiBrowser.generateContent(completePrompt);
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
        await this.aiBrowser.uploadScreenshot(screenshotPath);
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
        const result = await this.aiBrowser.generateContent(completePrompt);
        return JSON.parse(result);
    }

}
