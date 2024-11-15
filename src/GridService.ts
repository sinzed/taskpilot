import { exec } from "child_process";
import { Step } from "./types/step";
import { HelperService } from "./HelperService";
import { ScreenShotOptions } from "./types/screenshot-options";

export class GridService {
  async takeScreenshotIfNotExist(
    screenShotOptions: ScreenShotOptions
  ) {
    const args: string[] = [];
    if (screenShotOptions.cellsToExtract) {
      args.push(`--cells ${screenShotOptions.cellsToExtract?.join(" ")}`)
    }
    if (screenShotOptions.inputScreenshotPath) {
      args.push(`--input_image ${screenShotOptions.inputScreenshotPath}`)
    }

    if (screenShotOptions.inputJsonPath) { args.push(`--input_json ${screenShotOptions.inputJsonPath}`) }
    args.push(`--output_json ${screenShotOptions.outputJsonPath}`)
    args.push(`--output_image ${screenShotOptions.screenshotPath}`)
    args.push(`--output_gridded_image ${screenShotOptions.outputGriddedPath}`)
    args.push(`--grid_size ${screenShotOptions.gridSize}`);
    const cmd = `python3 ./pies/screenshot.py ` + args.join(" ");
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
    })
  }
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