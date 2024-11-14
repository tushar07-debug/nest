const express = require('express');
const cors = require('cors');

const bodyParser = require('body-parser');
const Stripe = require('stripe');
const mongoose = require('mongoose');

const stripe = Stripe('sk_test_51PY8KTRsGojz0TAj7mtfLumk1ve5WCrzUyKClA2n2DUVITOHpXQ9UtoTP6zSHSLPpcqJhh0GkLsExyZJOJ1n4QUd00wsq7hyzk'); // Replace with your actual secret key


const app = express();
const port = 5000;
app.use(bodyParser.json());

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
const mongoUri = 'mongodb://localhost:27017/BookStore';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Define a schema and model for the books
const bookSchema = new mongoose.Schema({
  bookName: String,
  description: String,
  mrp: Number,
  url: String
});

const Book = mongoose.model('Book', bookSchema);

app.get('/', (req, res) => {
    res.send('Hello, World!');
});
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'inr',
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/getAllBooks', async (req, res) => {
    try {
      const books = await Book.find(); // Retrieve all books from MongoDB
      res.status(200).json({ books });
    } catch (error) {
      console.error('Error retrieving books:', error);
      res.status(500).json({ message: 'Failed to retrieve books', error });
    }
  });

app.post('/addBook', async (req, res) => {
    const data = req.body;
    console.log('Received data:', data);

    // Create a new book instance
    const book = new Book({
        bookName: data.bookName,
        description: data.description,
        mrp: data.mrp,
        url: data.url
    });

    try {
        // Save the book to the database
        const savedBook = await book.save();
        res.status(201).json({ message: 'Book added successfully', book: savedBook });
    } catch (error) {
        console.error('Error saving book:', error);
        res.status(500).json({ message: 'Failed to add book', error });
    }
});

// Route to delete a book by ID
app.delete('/deleteBook/:id', async (req, res) => {
  const bookId = req.params.id;

  try {
    const deletedBook = await Book.findByIdAndDelete(bookId);
    if (!deletedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json({ message: 'Book deleted successfully', deletedBook });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Failed to delete book', error });
  }
});

app.post('/confirm-payment', async (req, res) => {
  const { paymentMethodId, amount, currency } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method: paymentMethodId,
      confirm: true,
    });

    res.status(200).json({ paymentIntent });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
