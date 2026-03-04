import axios from 'axios';

async function testSearch() {
    try {
        console.log("Testing semantic search (Chat API)...");
        const response = await axios.post('http://localhost:3001/api/search', {
            query: "asdfghjkl",
            topK: 6
        });
        console.log("Search Results Status: ", response.status);
        console.log("Results count: ", response.data.results.length);
        if (response.data.results.length > 0) {
            console.log("First result: ", response.data.results[0].documentName);
            console.log("Score: ", response.data.results[0].score);
        }
    } catch (err) {
        console.error("Search Test Failed: ", err.response?.data || err.message);
    }
}

testSearch();
