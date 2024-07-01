import express from 'express';
import routes from './routes/index';

const port = process.env.PORT || 5000;
const server = express();

server.use(express.json());
server.use(routes);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default server;
