import express from 'express';
import open from 'open';

const app = express();
const port = 3000;

app.use(express.static('docs'));

app.get('/', (_, res) => {
  res.send(htmlContent);
});

app.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`Server running at ${url}`);
  open(url);
});
