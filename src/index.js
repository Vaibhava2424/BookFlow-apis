"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var mongoose_1 = require("mongoose");
var dotenv_1 = require("dotenv");
var zod_1 = require("zod");
var bcrypt_1 = require("bcrypt");
var jsonwebtoken_1 = require("jsonwebtoken");
// Load environment variables from the .env file
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = process.env.PORT || 5000;
var MONGO_URI = process.env.MONGO_URI;
// Middleware to parse JSON request bodies
app.use(express_1.default.json());
// Check if MONGO_URI is defined before attempting connection
if (!MONGO_URI) {
    console.error("Missing MONGO_URI in environment variables. Please check your .env file.");
    process.exit(1);
}
// Check if JWT_SECRET is defined
var JWT_SECRET = process.env.JWT_SECRET || "a-secret-key-for-jwt";
// --- Mongoose Schema Definitions ---
// User Schema
var userSchema = new mongoose_1.Schema({
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
var UserModel = (0, mongoose_1.model)('Users', userSchema);
// Author Schema
var authorSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true }
});
var AuthorModel = (0, mongoose_1.model)('Author', authorSchema);
// Genre Schema
var genreSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: false }
});
var GenreModel = (0, mongoose_1.model)('Genre', genreSchema);
// Book Schema
var bookSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    authorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Author', required: true },
    genreId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Genre', required: true },
    pages: { type: Number, required: true },
    publishedDate: { type: Date, required: true }
});
var BookModel = (0, mongoose_1.model)('Book', bookSchema);
// Connect to MongoDB
mongoose_1.default.connect(MONGO_URI)
    .then(function () {
    console.log("Connected to MongoDB");
})
    .catch(function (err) {
    console.log("Error connecting to MongoDB:", err);
});
// Default route to check if server is running
app.get("/", function (req, res) {
    res.status(200).json({ message: "Backend API is running" });
});
// User Authentication Routes
app.post("/api/v1/signup", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, email, password, userDataRules, userValidation, existingUser, hashedPassword, newUser, _b, _, userWithoutPassword, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.body, username = _a.username, email = _a.email, password = _a.password;
                userDataRules = zod_1.default.object({
                    username: zod_1.default.string().min(3).max(12),
                    email: zod_1.default.string().email(),
                    password: zod_1.default.string().min(5).max(15)
                });
                userValidation = userDataRules.safeParse({ username: username, password: password, email: email });
                if (!userValidation.success) {
                    return [2 /*return*/, res.status(400).json({
                            message: "Invalid credentials",
                            error: userValidation.error.issues
                        })];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 5, , 6]);
                return [4 /*yield*/, UserModel.findOne({ $or: [{ username: username }, { email: email }] })];
            case 2:
                existingUser = _c.sent();
                if (existingUser) {
                    return [2 /*return*/, res.status(409).json({ message: "User already exists" })];
                }
                return [4 /*yield*/, bcrypt_1.default.hash(password, 10)];
            case 3:
                hashedPassword = _c.sent();
                return [4 /*yield*/, UserModel.create({
                        username: username,
                        email: email,
                        password: hashedPassword
                    })];
            case 4:
                newUser = _c.sent();
                _b = newUser.toObject(), _ = _b.password, userWithoutPassword = __rest(_b, ["password"]);
                res.status(201).json({
                    message: "User successfully created",
                    result: userWithoutPassword
                });
                return [3 /*break*/, 6];
            case 5:
                error_1 = _c.sent();
                res.status(500).json({ message: "Server error during signup", error: error_1 });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
app.post("/api/v1/signin", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, signinRules, signinValidation, user, passwordMatch, token, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, username = _a.username, password = _a.password;
                signinRules = zod_1.default.object({
                    username: zod_1.default.string().min(3).max(12),
                    password: zod_1.default.string().min(5).max(15)
                });
                signinValidation = signinRules.safeParse({ username: username, password: password });
                if (!signinValidation.success) {
                    return [2 /*return*/, res.status(400).json({
                            message: "Invalid credentials",
                            error: signinValidation.error.issues
                        })];
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                return [4 /*yield*/, UserModel.findOne({ username: username })];
            case 2:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ message: "Invalid username or password" })];
                }
                return [4 /*yield*/, bcrypt_1.default.compare(password, user.password)];
            case 3:
                passwordMatch = _b.sent();
                if (!passwordMatch) {
                    return [2 /*return*/, res.status(401).json({ message: "Invalid username or password" })];
                }
                token = jsonwebtoken_1.default.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
                res.status(200).json({
                    message: "Signed in successfully",
                    token: token,
                    user: {
                        username: user.username,
                        email: user.email
                    }
                });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _b.sent();
                res.status(500).json({ message: "Server error during signin", error: error_2 });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Get all books with filtering and pagination
app.get('/api/books', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, genre, author, _b, page, _c, limit, query, genreDoc, authorDoc, pageNumber, limitNumber, books, err_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 6, , 7]);
                _a = req.query, genre = _a.genre, author = _a.author, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c;
                query = {};
                if (!genre) return [3 /*break*/, 2];
                return [4 /*yield*/, GenreModel.findOne({ name: genre })];
            case 1:
                genreDoc = _d.sent();
                if (genreDoc) {
                    query.genreId = genreDoc._id;
                }
                _d.label = 2;
            case 2:
                if (!author) return [3 /*break*/, 4];
                return [4 /*yield*/, AuthorModel.findOne({ name: author })];
            case 3:
                authorDoc = _d.sent();
                if (authorDoc) {
                    query.authorId = authorDoc._id;
                }
                _d.label = 4;
            case 4:
                pageNumber = parseInt(page);
                limitNumber = parseInt(limit);
                return [4 /*yield*/, BookModel.find(query)
                        .limit(limitNumber)
                        .skip((pageNumber - 1) * limitNumber)];
            case 5:
                books = _d.sent();
                res.status(200).json(books);
                return [3 /*break*/, 7];
            case 6:
                err_1 = _d.sent();
                res.status(500).json({ message: 'Error fetching books', error: err_1 });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
// Get a single book by ID
app.get('/api/books/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var book, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, BookModel.findById(req.params.id)];
            case 1:
                book = _a.sent();
                if (!book) {
                    return [2 /*return*/, res.status(404).json({ message: 'Book not found' })];
                }
                res.status(200).json(book);
                return [3 /*break*/, 3];
            case 2:
                err_2 = _a.sent();
                res.status(500).json({ message: 'Error fetching book', error: err_2 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Creating Multiple books
app.post('/api/books/all', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var books, err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, BookModel.insertMany(req.body)];
            case 1:
                books = _a.sent();
                res.status(201).json(books);
                return [3 /*break*/, 3];
            case 2:
                err_3 = _a.sent();
                res.status(500).json({ message: 'Error adding books', error: err_3 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Create a new book
app.post('/api/books', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var newBook, savedBook, err_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                newBook = new BookModel(req.body);
                return [4 /*yield*/, newBook.save()];
            case 1:
                savedBook = _a.sent();
                res.status(201).json(savedBook);
                return [3 /*break*/, 3];
            case 2:
                err_4 = _a.sent();
                res.status(500).json({ message: 'Error adding book', error: err_4 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Update a book by ID
app.put('/api/books/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var updatedBook, err_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, BookModel.findByIdAndUpdate(req.params.id, req.body, { new: true })];
            case 1:
                updatedBook = _a.sent();
                if (!updatedBook) {
                    return [2 /*return*/, res.status(404).json({ message: 'Book not found' })];
                }
                res.status(200).json(updatedBook);
                return [3 /*break*/, 3];
            case 2:
                err_5 = _a.sent();
                res.status(500).json({ message: 'Error updating book', error: err_5 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Delete a book by ID
app.delete('/api/books/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var deletedBook, err_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, BookModel.findByIdAndDelete(req.params.id)];
            case 1:
                deletedBook = _a.sent();
                if (!deletedBook) {
                    return [2 /*return*/, res.status(404).json({ message: 'Book not found' })];
                }
                res.status(200).json({ message: 'Book successfully deleted' });
                return [3 /*break*/, 3];
            case 2:
                err_6 = _a.sent();
                res.status(500).json({ message: 'Error deleting book', error: err_6 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Routes for Authors
app.post('/api/authors', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var newAuthor, savedAuthor, err_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                newAuthor = new AuthorModel(req.body);
                return [4 /*yield*/, newAuthor.save()];
            case 1:
                savedAuthor = _a.sent();
                res.status(201).json(savedAuthor);
                return [3 /*break*/, 3];
            case 2:
                err_7 = _a.sent();
                res.status(500).json({ message: 'Error adding author', error: err_7 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/api/authors', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authors, err_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, AuthorModel.find()];
            case 1:
                authors = _a.sent();
                res.status(200).json(authors);
                return [3 /*break*/, 3];
            case 2:
                err_8 = _a.sent();
                res.status(500).json({ message: 'Error fetching authors', error: err_8 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Routes for Genres
app.post('/api/genres', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var newGenre, savedGenre, err_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                newGenre = new GenreModel(req.body);
                return [4 /*yield*/, newGenre.save()];
            case 1:
                savedGenre = _a.sent();
                res.status(201).json(savedGenre);
                return [3 /*break*/, 3];
            case 2:
                err_9 = _a.sent();
                res.status(500).json({ message: 'Error adding genre', error: err_9 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/api/genres', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var genres, err_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, GenreModel.find()];
            case 1:
                genres = _a.sent();
                res.status(200).json(genres);
                return [3 /*break*/, 3];
            case 2:
                err_10 = _a.sent();
                res.status(500).json({ message: 'Error fetching genres', error: err_10 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Start the server
app.listen(PORT, function () {
    console.log("Server is running on http://localhost:".concat(PORT));
});
