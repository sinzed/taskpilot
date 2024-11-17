import { GridService } from "./GridService";
import { Step } from "./types/step";
import { OpenAiBrowser } from "./OpenAiBrowser";
import { HelperService } from "./HelperService";
import { ScreenShotOptions } from "./types/screenshot-options";
import fs from "fs";
import { Cell } from "./types/Cell";
import { ClaudeBrowser } from "./ClaudeBrowser";

export class TaskManager {
    // aiBrowser = new OpenAiBrowser();
    aiBrowser = new ClaudeBrowser();
    gridService = new GridService();
    async run() {
        const prompt = "click on microsoft teams";
        await this.prepareWorkingDirectory();
        const response = await this.resolve(prompt);
        // console.log(content);
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
    async resolve(prompt: string): Promise<{x: number, y:number}> {
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
            gridSize: 6,
            outputJsonPath: screenshotPath2+".json",
            outputGriddedPath: screenshotGriddedPath2
        }
        const result2 = await this.takeScreenshotAndAsk(screenShotOptions2, screenshotGriddedPath2, prompt);
        console.log(result2);
        const parsedJson2 :{cells: number[]} = JSON.parse(result);
        const clickPosition = this.getClickPositionByCell(parsedJson, screenShotOptions.outputJsonPath, parsedJson2, screenShotOptions2.outputJsonPath );
        await this.thirdDetect(result2, screenShotOptions2, prompt);

        return clickPosition;
    }
    getClickPositionByCell(response: {cells: number[]}, cellsPath1: string, response2: {cells:number[]}, cellsPath2:string): {x: number, y: number} {
        const jsonText = fs.readFileSync(cellsPath1);
        const grid:Cell[] = JSON.parse(jsonText.toString());
        const jsonText2 = fs.readFileSync(cellsPath2);
        const grid2:Cell[] = JSON.parse(jsonText2.toString());
        const cells = response.cells;
        const cells2 = response2.cells;
        const cell1 = cells[0];
        const cell2 = cells2[0];
        const cell1Data = grid.find((cell: Cell) => cell.cell_number === cell1);
        const cell2Data = grid2.find((cell: Cell) => cell.cell_number === cell2);
        const cell1X1 = cell1Data?.coordinates.x1 ?? 0;
        const cell1X2 = cell2Data?.coordinates.x2 ?? 0;
        const cell1Y1 = cell1Data?.coordinates.y1 ?? 0;
        const cell1Y2 = cell2Data?.coordinates.y2 ?? 0;
        const x = (cell1X1 + cell1X2) / 2;
        const y = (cell1Y1 + cell1Y2) / 2;
        return {x, y};

    }
    private async thirdDetect(result2: string, screenShotOptions2: ScreenShotOptions, prompt: string) {
        const parsedJson2: { cells: number[]; } = JSON.parse(result2);
        const cellsToTextract2 = this.getCellsToExtract(parsedJson2.cells, screenShotOptions2.outputJsonPath, screenShotOptions2.gridSize);
        const screenShotOptions3: ScreenShotOptions = {
            cellsToExtract: cellsToTextract2,
            inputJsonPath: screenShotOptions2.outputJsonPath,
            inputScreenshotPath: screenShotOptions2.screenshotPath,
            screenshotPath: HelperService.workingDirectory + "screenshot3.png",
            gridSize: 3,
            outputJsonPath: HelperService.workingDirectory + "screenshot3.png.json",
            outputGriddedPath: HelperService.workingDirectory + "screenshot_gridded3.png"
        };
        const result3 = await this.takeScreenshotAndAsk(screenShotOptions3, HelperService.workingDirectory + "screenshot_gridded3.png", prompt);
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
        const completePrompt = this.getFindCellprompt(prompt);
        const result = await this.aiBrowser.generateContent(completePrompt);
        return result;
    }

    private getFindCellprompt(prompt: string) {
        const promptTemplate = `"For the task: '${prompt}'
                        IMPORTANT INSTRUCTIONS:

                        Look EXTREMELY carefully at the entire grid
                        Check if any icons/elements span across multiple cells
                        Pay special attention to elements that cross cell boundaries
                        Double-check all cells for any related content
                        Include ALL cells that contain even a small part of the target element
                        Review your answer twice before submitting to ensure no cells are missed

                        Please provide ALL cell numbers that contain any part of the target element in this format:
                        {
                        cells: number[] (include every cell number that contains any portion of the target)
                        }"
                        Please just write the json
                        This kind of detailed instruction would help ensure I examine the image more thoroughly and don't miss any cells that contain parts of the target element. The emphasis on thoroughness and multiple checks would help avoid incomplete answers.`

        let promptTemplate2 = `we are going to do:  "${prompt}"
            you task is to find the cells which are related to the task
            forexample if the task is to click on an icon or clickspot
            sometimes this click spot is related to multiple cells
            when the task is related to multiple cells please write all the cell numbers
            now please, look very carefully at the image the desktop screenshot
             find the cells which are related to the task and write the cell numbers in the following format: 
            {
                cells: number[] (array of cell numbers) (cell numbers are located inside the cell)
            }
            the  screenshot has been attached 
            can you please just write the json

        `;
        return promptTemplate
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
