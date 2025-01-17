import mongoose from 'mongoose';

import app from './app.js';

const { DB_HOST, JWT_SECRET, PORT = 3000 } = process.env;

mongoose
  .connect(DB_HOST)
  .then(() => {
    app.listen(3000, () => {
      console.log(`Server running. Use our API on port: ${PORT}`);
    });

    console.log('Success connection to database');
  })
  .catch(error => {
    console.log(error.message);
    process.exit(1);
  });
// mNfolheFyQPwAIIJ
