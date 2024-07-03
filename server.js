const net = require('node:net');
const fs = require('node:fs/promises');

const PORT = 5050;
const HOSTNAME = '172.31.19.42';
//const HOSTNAME = '::1';

const server = net.createServer(() => {});

let fileHandle, fileWriteStream;

server.on('connection', (socket) => {
    console.log('New connection!');

    socket.on('data', async (data) => {
        if(!fileHandle) {
            socket.pause();

            const indexOfDivider = data.indexOf('---');
            const fileName = data.subarray(10, indexOfDivider).toString('utf-8');

            fileHandle = await fs.open(`./NewCarpet/${fileName}`, 'w');
            fileWriteStream = fileHandle.createWriteStream({highWaterMark: Math.pow(2, 20)});

            //Writing to out destination file.
            fileWriteStream.write(data.subarray(indexOfDivider + 3));
            socket.resume();

            fileWriteStream.on('drain', () => {
                socket.resume();
            });
        } else {
            if(!fileWriteStream.write(data)) {
                socket.pause();
            }
        }
    });

    socket.on('end', () => {
        if(fileHandle) fileHandle.close();
        fileHandle = undefined;
        fileWriteStream = undefined;
        console.log('Connection ended.');
    })
});

server.listen(PORT, HOSTNAME, ()=>{
    console.log('uploader server opened on', server.address());
});