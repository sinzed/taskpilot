export type ScreenShotOptions = {
    screenshotPath: string,
    cellsToExtract?: number[],
    inputJsonPath?: string,
    inputScreenshotPath?: string,
    outputJsonPath: string,
    outputGriddedPath: string,
    gridSize: number
}