import { exec } from "child_process";
import { Step } from "./types/step";

export class GridService {
        takeScreenshotIfNotExist(
          screenshotPath: string, 
          cellsToExtract?: [], 
          inputJsonPath?:string,
          inputScreenshotPath?:string,
          outputJsonPath:string = './data/grids/output.json',
          outputGriddedPath:string ='./data/grids/gridded.png',
          gridSize:number = 10
        ) {
          const args:string[] = [];
          args.push(`--cells ${cellsToExtract?.join(" ")}`) 
          args.push(`--input_image ${inputScreenshotPath}`)
          args.push(`--input_json ${inputJsonPath}`)
          args.push(`--output_json ${outputJsonPath}`)
          args.push(`--output_image ${screenshotPath}`)
          args.push(`--output_gridded_image ${outputGriddedPath}`)
          args.push(`--grid_size ${gridSize}`);
          const cmd = `python3 ./pies/screenshot.py `+args.join(" ");
          console.log(cmd);
          return new Promise((resolve, reject) => {
            exec(cmd, { maxBuffer: 1024 * 500 }, async (err, stdout, stderr) => {
              if (err) {
                console.log(err);
                // reject("error of cut via moviepy" + err)
                resolve(false)
              }
              else {
                console.log("gridify done", stdout);
                resolve(true);
              }
            })
          })        }
        createGrids(step: Step) {

        }
        findCellPosition(clickSpot: string) {
            throw new Error("Method not implemented.");
        }
        constructor() {
        }
        gridify(step: Step): Promise<boolean> {
            const cmd = `python3 gridify.py ${step.screenshotPath} 10 ${step.gridJsonPath}`;
            return new Promise((resolve, reject) => {
              exec(cmd, { maxBuffer: 1024 * 500 }, async (err, stdout, stderr) => {
                if (err) {
                  console.log(err);
                  // reject("error of cut via moviepy" + err)
                  resolve(false)
                }
                else {
                  console.log("gridify done", stdout);
                  resolve(true);
                }
              })
            })
          }
}