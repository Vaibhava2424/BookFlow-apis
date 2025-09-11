/**
 * BookFlow Backend API (Simplified)
 *
 * This file serves as the main entry point for the backend API.
 * It includes all the necessary code for:
 * 1. Connecting to a MongoDB database.
 * 2. Defining a single Mongoose schema for Books.
 * 3. Implementing user authentication routes (signup and signin).
 * 4. Providing full CRUD (Create, Read, Update, Delete) functionality
 * for books.
 *
 * All logic is contained within this single file for simplicity.
 */
import express from 'express';
import cors from 'cors';
import mongoose, { Schema, model } from 'mongoose';
import dotenv from 'dotenv';
import z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// Load environment variables from the .env file
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
app.use(cors());
// Middleware to parse JSON request bodies
app.use(express.json());
// Check if MONGO_URI is defined before attempting connection
if (!MONGO_URI) {
    console.error("Missing MONGO_URI in environment variables. Please check your .env file.");
    process.exit(1);
}
// Check if JWT_SECRET is defined
const JWT_SECRET = process.env.JWT_SECRET || "a-secret-key-for-jwt";
// --- Mongoose Schema Definitions ---
// User Schema
const userSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        minlength: 4
    },
    password: {
        type: String,
        required: true
    }
});
const UserModel = model('Users', userSchema);
// Book Schema (Simplified)
const bookSchema = new Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    genre: { type: String, required: true },
    publishedDate: { type: Date, required: true },
    image: { type: String, required: true },
    description: { type: String, required: false }
});
const BookModel = model('Book', bookSchema);
// User Book Schema (books added by users)
const userBookSchema = new Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    genre: { type: String, required: true },
    publishedDate: { type: Date, required: true },
    image: { type: String, required: true },
    description: { type: String, required: false },
    userId: { type: String, required: true } // link book to logged-in user
});
const UserBookModel = model('UserBook', userBookSchema);
// --- End of Schema Definitions ---
// --- Middleware ---
// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Expect "Bearer <token>"
    if (!token)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
// Connect to MongoDB
mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB successfully"))
    .catch((err) => {
    console.error("❌ MongoDB connection failed:");
    console.error(err);
    process.exit(1);
});
// Default route to check if server is running
app.get("/", (req, res) => {
    res.status(200).json({ message: "Backend API is running" });
});
// User Authentication Routes
app.post("/api/v1/signup", async (req, res) => {
    const { username, email, password } = req.body;
    // Zod validation
    const userDataRules = z.object({
        username: z.string(),
        email: z.string().email(), // Corrected email validation
        password: z.string()
    });
    const userValidation = userDataRules.safeParse({ username, password, email });
    if (!userValidation.success) {
        return res.status(400).json({
            message: "Invalid credentials",
            error: userValidation.error.issues
        });
    }
    try {
        const existingUser = await UserModel.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }
        // Hashing password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Creating a user
        const newUser = await UserModel.create({
            username,
            email,
            password: hashedPassword
        });
        const { password: _, ...userWithoutPassword } = newUser.toObject();
        res.status(201).json({
            message: "User successfully created",
            result: userWithoutPassword
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error during signup", error });
    }
});
app.post("/api/v1/signin", async (req, res) => {
    const { username, password } = req.body;
    const signinRules = z.object({
        username: z.string(),
        password: z.string()
    });
    const signinValidation = signinRules.safeParse({ username, password });
    if (!signinValidation.success) {
        return res.status(400).json({
            message: "Invalid credentials",
            error: signinValidation.error.issues
        });
    }
    try {
        const user = await UserModel.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({
            message: "Signed in successfully",
            token,
            user: {
                username: user.username,
                email: user.email
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error during signin", error });
    }
});
// Get all users (with credentials except password)
app.get('/api/users', async (req, res) => {
    try {
        // Exclude password field for safety
        const users = await UserModel.find();
        res.status(200).json(users);
    }
    catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ message: "Error fetching users", error: err });
    }
});
// Delete a user by ID
app.delete('/api/users/:id', async (req, res) => {
    try {
        const deletedUser = await UserModel.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User successfully deleted", deletedUser });
    }
    catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ message: "Error deleting user", error: err });
    }
});
// Get all books with filtering and pagination
app.get('/api/books', async (req, res) => {
    try {
        const books = await BookModel.find();
        console.log("Books fetched:", books);
        res.status(200).json(books);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching books', error: err });
    }
});
// Get a single book by ID
app.get('/api/books/:id', async (req, res) => {
    try {
        const book = await BookModel.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.status(200).json(book);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching book', error: err });
    }
});
// Add a new user-specific book
app.post('/api/user-books', authMiddleware, async (req, res) => {
    try {
        const { title, author, genre, image, description, publishedDate } = req.body;
        const userId = req.user.userId;
        const newBook = await UserBookModel.create({
            title,
            author,
            genre,
            image,
            description,
            publishedDate,
            userId
        });
        res.status(201).json({ message: 'Book added successfully', newBook });
    }
    catch (err) {
        res.status(500).json({ message: 'Error adding book', error: err });
    }
});
// Get all books added by this user
app.get('/api/user-books', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const books = await UserBookModel.find({ userId });
        res.status(200).json(books);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching user books', error: err });
    }
});
// Get a single user book by ID
app.get('/api/user-books/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const book = await UserBookModel.findOne({ _id: req.params.id, userId });
        if (!book)
            return res.status(404).json({ message: 'Book not found' });
        res.status(200).json(book);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching user book', error: err });
    }
});
// Update a user-specific book by ID
app.put('/api/user-books/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const updatedBook = await UserBookModel.findOneAndUpdate({ _id: req.params.id, userId }, req.body, { new: true });
        if (!updatedBook)
            return res.status(404).json({ message: 'Book not found' });
        res.status(200).json(updatedBook);
    }
    catch (err) {
        res.status(500).json({ message: 'Error updating user book', error: err });
    }
});
// Delete a user-specific book by ID
app.delete('/api/user-books/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const deletedBook = await UserBookModel.findOneAndDelete({ _id: req.params.id, userId });
        if (!deletedBook)
            return res.status(404).json({ message: 'Book not found' });
        res.status(200).json({ message: 'Book deleted successfully', deletedBook });
    }
    catch (err) {
        res.status(500).json({ message: 'Error deleting user book', error: err });
    }
});
// Creating Multiple books
app.post('/api/books/all', async (req, res) => {
    try {
        const books = await BookModel.insertMany(req.body);
        res.status(201).json(books);
    }
    catch (err) {
        res.status(500).json({ message: 'Error adding books', error: err });
    }
});
// Create a new book
app.post('/api/books', async (req, res) => {
    try {
        const newBook = new BookModel(req.body);
        const savedBook = await newBook.save();
        res.status(201).json(savedBook);
    }
    catch (err) {
        res.status(500).json({ message: 'Error adding book', error: err });
    }
});
// Update a book by ID
app.put('/api/books/:id', async (req, res) => {
    try {
        const updatedBook = await BookModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedBook) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.status(200).json(updatedBook);
    }
    catch (err) {
        res.status(500).json({ message: 'Error updating book', error: err });
    }
});
// Delete a book by ID
app.delete('/api/books/:id', async (req, res) => {
    try {
        const deletedBook = await BookModel.findByIdAndDelete(req.params.id);
        if (!deletedBook) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.status(200).json({ message: 'Book successfully deleted' });
    }
    catch (err) {
        res.status(500).json({ message: 'Error deleting book', error: err });
    }
});
// --- API Routes for Users ---
// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await UserModel.find().select('-password'); // Exclude passwords
        res.status(200).json(users);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching users', error: err });
    }
});
// Delete a user by ID
app.delete('/api/users/:id', async (req, res) => {
    try {
        const deletedUser = await UserModel.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User successfully deleted' });
    }
    catch (err) {
        res.status(500).json({ message: 'Error deleting user', error: err });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map