const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const apiKey = "YOUR_OPENAI_API_KEY_HERE";

try {
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  if (!content.includes('OPENAI_API_KEY=')) {
    content += `\nOPENAI_API_KEY=${apiKey}\n`;
    fs.writeFileSync(envPath, content);
    console.log('OPENAI_API_KEY added to .env');
  } else {
    console.log('OPENAI_API_KEY already exists in .env');
  }
} catch (err) {
  console.error('Error updating .env:', err);
}
