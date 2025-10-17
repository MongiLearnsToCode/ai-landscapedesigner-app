import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';

const app = express();
const PORT = 3001;

app.use(cors());
app.use('/api/auth', toNodeHandler(auth));

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
