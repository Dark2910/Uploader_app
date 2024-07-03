const net = require('node:net');
const fs = require('node:fs/promises');
const path = require('node:path');

const PORT = 5050;
const HOSTNAME = '3.129.207.108';
//const HOSTNAME = '::1';

const clearLine = (dir) => new Promise((resolve, reject) => {
    process.stdout.clearLine(dir, () => {
        resolve();
    });
});

const moveCursor = (dx, dy) => new Promise((resolve, reject) => {
    process.stdout.moveCursor(dx, dy, () => {
        resolve();
    })
});

const socket = net.createConnection(PORT, HOSTNAME, async () => {

    const filePath = process.argv[2];
    const fileName = path.basename(filePath);
    const fileHandle = await fs.open(filePath, 'r');
    const fileReadStream = fileHandle.createReadStream({highWaterMark: Math.pow(2, 20)});

    const fileSize = (await fileHandle.stat()).size;
    // For showing the upload progress
    let uploaderPercentage = 0;
    let bytesUploaded = 0;
    // to get a nice log for the progress percentage
    console.log(); 

    socket.write(`fileName: ${fileName}---`);

    // Reading from the source file
    fileReadStream.on('data', async (data) => {
        if(!socket.write(data)){
            fileReadStream.pause();
        }

        bytesUploaded += data.length;
        let newPercentage = Math.floor((bytesUploaded / fileSize) * 100);
    
        if(newPercentage !== uploaderPercentage) {
            uploaderPercentage = newPercentage;
            await moveCursor(0, -1);
            await clearLine(0);
            console.log(`Uploading...${uploaderPercentage}%`);
        }
    });

    socket.on('drain', () => {
        fileReadStream.resume();
    });

    fileReadStream.on('end', () => {
        console.log('The file was successfully uploaded!');
        socket.end();
    });
});

