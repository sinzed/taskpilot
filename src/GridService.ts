import { exec } from "child_process";
import { Step } from "./types/step";

export class GridService {
        createGrids(step: Step) {

        }
        findCellPosition(clickSpot: string) {
            throw new Error("Method not implemented.");
        }
        constructor() {
        }
        cutViaMoviePy(step: Step): Promise<boolean> {
            const cmd = `python3 grid.py ${step.screenshotPath}`;
            return new Promise((resolve, reject) => {
              exec(cmd, { maxBuffer: 1024 * 500 }, async (err, stdout, stderr) => {
                if (err) {
                  console.log(err);
                  // reject("error of cut via moviepy" + err)
                  resolve(false)
                }
                else {
                  console.log("cut via python done", stdout);
                  resolve(true);
                }
              })
            })
          }
}