import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const key = process.env.GOOGLE_API_KEY;
    try {
        console.log(`Checking models via REST API with key: ${key.substring(0, 8)}...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await axios.get(url);

        console.log("All Models: ", response.data.models.map(m => m.name));
    } catch (err) {
        console.error("REST Error:", err.response?.data || err.message);
    }
}

listModels();
