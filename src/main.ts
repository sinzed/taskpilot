import { OpenAiBrowser } from "./OpenAiBrowser";
import { TaskManager } from "./task-manager";

class main{
    async run(){
        const taskManager = new TaskManager();
        await taskManager.run();
    }
}
new main().run();