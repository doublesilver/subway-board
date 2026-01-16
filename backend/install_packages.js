const { exec } = require('child_process');

exec('npm install openai badwords-ko', { cwd: './backend' }, (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
});
