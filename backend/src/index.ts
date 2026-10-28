import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`TGlobal Loan Backend running on http://localhost:${PORT}`);
});
