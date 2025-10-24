const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const chatRoutes = require('./routes/chatRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const { PORT } = require('./config');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/chat', chatRoutes);
app.use('/api/ticket', ticketRoutes);
app.use('/api/mock-orders', ordersRoutes);

app.get('/', (req, res) => res.json({ success: true, message: 'Prompt-based Chatbot API' }));

app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
