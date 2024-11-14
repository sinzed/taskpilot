import { OpenAiBrowser } from "./OpenAiBrowser";

export class TaskManager {
    openAiBrowser = new OpenAiBrowser();
    async run() {
        const prompt = "please open browser";
        const content = await this.solve(prompt);

        // const content = await openAiBrowser.generateContent(prompt);
        console.log(content);
    }
    async solve(prompt: string): Promise<string> {
        await this.openAiBrowser.detectClickPlace();
        const completePrompt = 
        `our goal is to use AI to achieve a task in different steps
        the taks is: "${prompt}"
        the starting point is ubuntu desktop
        now please write the steps in the following format:
        {
            
            [
                "action": "click",
                "clickSpot": "describe the click area so The AI can detect it",
            ]

        }
            the desktop screenshot of the current status has been attached 
        `;
        const result = await this.openAiBrowser.generateContent(completePrompt);
        return result;
    }
}