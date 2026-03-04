import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-pro'
];

async function checkKey(keyName, keyValue) {
    if (!keyValue) return;
    console.log(`Checking ${keyName}...`);
    const genAI = new GoogleGenerativeAI(keyValue);
    for (const modelName of modelsToTry) {
        try {
            console.log(`- Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("hello");
            console.log(`  ✅ SUCCESS with ${keyName} and ${modelName}!`);
            return;
        } catch (err) {
            console.log(`  ❌ FAILED ${modelName}: ${err.message.substring(0, 100)}`);
        }
    }
}

async function main() {
    await checkKey("GOOGLE_API_KEY", process.env.GOOGLE_API_KEY);
    await checkKey("GEMINI_API_KEY", process.env.GEMINI_API_KEY);
}

main();
