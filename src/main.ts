import { OpenAiBrowser } from "./OpenAiBrowser";
import { TaskManager } from "./task-manager";
import 'source-map-support/register';
class main{
    async run(){
        const taskManager = new TaskManager();
        await taskManager.run();
    }
}
new main().run();