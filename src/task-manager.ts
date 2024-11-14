import { OpenAiBrowser } from "./OpenAiBrowser";

export class TaskManager {
    async run() {
        const openAiBrowser = new OpenAiBrowser();
        const prompt = "How to open browser?";
        const content = await openAiBrowser.solve(prompt);
        // const content = await openAiBrowser.generateContent(prompt);
        console.log(content);
    }
}