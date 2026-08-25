const fs = require('fs');
const path = require('path');

module.exports = async function (context) {
  const destPath = path.join(context.appOutDir, 'ffmpeg.dll');
  const srcPath = path.join(__dirname, 'ffmpeg.dll');
  
  console.log(`Replacing default ffmpeg.dll with non-proprietary version in: ${destPath}`);
  
  if (fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('Successfully replaced ffmpeg.dll!');
  } else {
    console.warn(`Destination path not found: ${destPath}`);
  }
};
