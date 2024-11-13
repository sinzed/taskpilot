import moment from 'moment';
import fs from 'fs'
import crypto from 'crypto';

export class HelperService {
    static slowDownText(sentence: string): string {
        const partText = sentence.split(" ").map(it=>it.trim()).filter(it=>it.length>0);

        const pausedText = partText.join('---');
        console.log("paused text", pausedText);
        return pausedText;
    }
    static normalizeSentence(sentence: string):string {
        // remove all enter and new line characters
        sentence = sentence.replace(/(\r\n|\n|\r)/gm, "");
        return sentence;

    }
    static isPersian(text: string) {
        return /[\u0600-\u06FF]/.test(text);
    }
    static async downloadFile(url: string, outputAddress: string) {
        const axios = require('axios');
        const fs = require('fs');
        const writer = fs.createWriteStream(outputAddress);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
        });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        
    }
    static cleanToJson(jsonText: string) {
        jsonText = jsonText.replace(/```json\n|```/g, '');
        let cleanText = jsonText.replace(/<s>/g, "'").replace(/<\/s>/g, "'");
        let jsonString = this.escapeInnerQuotes(cleanText);
        jsonString = this.escapeInnerQuotes(jsonString);
        jsonString = this.escapeInnerQuotes(jsonString);
        jsonString = this.escapeInnerQuotes(jsonString);
        jsonString = this.escapeInnerQuotes(jsonString);
        jsonString = this.escapeInnerQuotes(jsonString);
        jsonString = this.escapeInnerQuotes(jsonString);
        jsonString = jsonString.replace(/\*/g, "");
        jsonString = jsonString.replace(/_/g, "");
        console.log("===>clean string");
        console.log(jsonString);
        console.log("<=====");
        return jsonString;
    }
    static escapeInnerQuotes(jsonString:string ) {
        jsonString = jsonString.replace(/":\s*"(.*)",/g, (match, p1) => {
            return `": "${p1.replace(/"/g, "'")}",`;
        });        
        jsonString = jsonString.replace(/":\s*"(.*)"\s*}/g, (match, p1) => {
            return `": "${p1.replace(/"/g, "'")}"\n}`;
        });
        jsonString =jsonString.replace(/\\'/g,"'")
        return jsonString;
    }

    static refineText(text: string): string {
        // return text.replace(/[^a-zA-Z0-9üÜöÖäÄ]/g, '');
        return text.replace(/^[^a-zA-Z0-9üÜöÖäÄ\u0600-\u06FF.,]+|[^a-zA-Z0-9üÜöÖäÄ\u0600-\u06FF.,]+$/g, '');
    }
    static getHash(part: string) {
        const hash = crypto.createHash('sha256');
        hash.update(part);
        // Truncate the hash to the first 10 characters
        return hash.digest('hex').substring(0, 10);
    }
    static workingDirectory = "./data/videos"

    static getPhraseFolder(phrase: string) {
        const folder = HelperService.workingDirectory + "/" + phrase.trim().toLowerCase().replace(/ /g, "-");
        if(!fs.existsSync(folder)) {
            fs.mkdirSync(folder)
        }

        return folder
      
    }
    static str1IncludeStr2Unsorted(str1:string, str2:string){
        console.log("comparing", str1, str2)
        const str2Array = str2.split(" ").map(it=>it.trim()).filter(it=>it.length>0)
        for (const word of str2Array) {
            if(!this.str1IncludeStr2(str1, word)){ 
                return false
            }
        }
        return true
    }    
    static getFactPhraseFolder(phrase: string) {
        const folder = HelperService.workingDirectory +"/"+ phrase.trim().toLowerCase() .replace(" ", "-")
        .replace(" ", "-")
        .replace(" ", "-")
        .replace(" ", "-")
        if(!fs.existsSync(folder)) {
            fs.mkdirSync(folder)
        }

        return folder
      
    }
    static compareTwoStrings(str1: string, str2: string) {
        return str1.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === str2.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        
    }    
    static str1IncludeStr2(str1: string, str2?: string) {
        if(!str2) return false
        console.log(str1.replace(/[^a-zA-Z0-9]/g, ''))
        console.log(str2.replace(/[^a-zA-Z0-9]/g, ''))    
        return str1.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes(str2.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
        
    }    
    static str1IncludeStr2Persian(str1: string, str2?: string) {
        if(!str2) return false

        let cleanefStr1 = str1.replace(/^[^a-zA-Z0-9üÜöÖäÄ\u0600-\u06FF]+|[^a-zA-Z0-9üÜöÖäÄ\u0600-\u06FF]+$/g, '')
        let cleanedStr2 = str2.replace(/^[^a-zA-Z0-9üÜöÖäÄ\u0600-\u06FF]+|[^a-zA-Z0-9üÜöÖäÄ\u0600-\u06FF]+$/g, '')   
        cleanefStr1 = cleanefStr1.replace("ي", "ی").replace("،","").replace(`،`,'').replace(" ", "")
        cleanedStr2 = cleanedStr2.replace("ي", "ی").replace("،","").replace(`،`,'').replace(" ", "")
        const result =  cleanefStr1.toLowerCase().includes(cleanedStr2.toLowerCase())
        if(!result){
            console.log(cleanefStr1, " does not include ", cleanedStr2)
        }
        else{
            console.log(cleanefStr1, " includes ", cleanedStr2)
        }
        return result
        
    }
    static retryOperation<T>(operation: () => Promise<T>, maxRetries: number, delay: number, rejectStrategy: ()=>void): Promise<T> {
        return new Promise((resolve, reject) => {
            async function  attempt() {
                try {
                    const result = await operation()
                    resolve(result)
                }
                catch (error) {
                    await rejectStrategy()
                    if (maxRetries <= 0) {
                        reject(error);
                    } else {
                        console.log(`Retrying operation, attempts left: ${maxRetries}`);
                        console.log(error);
                        maxRetries--;
                        setTimeout(attempt, delay);
                    }
                }
            }
            attempt();
        });
    }
    static strTimeToDuration(startTimeText:string):number {
        const startTime = moment(startTimeText, 'HH:mm:ss.SSSSSSSSSSSS');
        const movieStartTime = moment('00:00:00.00000000000000', 'HH:mm:ss.SSSSSSSSSSSS');
        const duration = moment.duration(startTime.diff(movieStartTime));
        const durationInSeconds = duration.asSeconds();
        return durationInSeconds
    }
       
    static durationToTimeString(durationInSecond:number): string {
        const duration = moment.duration(durationInSecond, 'seconds');
        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        const milliseconds = duration.milliseconds();
        return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
    static waitForTimeout(timeOut: number) {
        return new Promise((resolve) => {
          setTimeout(resolve, timeOut);
        });
      }
}