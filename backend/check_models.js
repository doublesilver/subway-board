const axios = require('axios');
require('dotenv').config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No API KEY found");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    console.log('Querying:', url.replace(key, 'HIDDEN_KEY'));

    try {
        const response = await axios.get(url);
        const models = response.data.models;

        const fs = require('fs');
        let output = 'Available Models:\n';
        models.forEach(m => {
            if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                output += `- ${m.name}\n`;
            }
        });
        fs.writeFileSync('models_list.txt', output);
        console.log('List saved to models_list.txt');

    } catch (error) {
        console.error('Error fetching models:', error.response ? error.response.data : error.message);
    }
}

listModels();
