const app = require('./app');
const http = require('http');

const PORT = 5000;
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Server error handling
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
        default:
            throw error;
    }
});