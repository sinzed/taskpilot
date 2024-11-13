import { OpenAiBrowser } from "./OpenAiBrowser";

export class TaskManager {
    async run() {
        const openAiBrowser = new OpenAiBrowser();
        const prompt = "Translate the following text to French: 'Hello, how are you?'";
        const content = await openAiBrowser.generateContent(prompt);
        console.log(content);
    }
}