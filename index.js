const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));

app.get('/', (req, res) => res.send('API Running'));
app.listen(process.env.PORT, () => 
    console.log(`App is listening at ${process.env.PORT}`)
);
