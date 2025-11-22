const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const fs = require('fs');
const bcrypt = require('bcrypt');

const app = express();

mongoose.connect(
    'mongodb+srv://abc:123@cluster0.mfy3yfo.mongodb.net/?appName=Cluster0',
    { useNewUrlParser: true, useUnifiedTopology: true }
);

const File = require('./models/File');
const User = require('./models/User');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    session({
        secret: 'secret123',
        resave: false,
        saveUninitialized: true,
    })
);

function isAuth(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login');
}

const apiRouter = require("./routes/api");
app.use("/api", apiRouter);

app.get('/', (req, res) => {
	res.render('index');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        let user = await User.findOne({ username });
        if (user) return res.send('Username already exists');

        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User({
            username,
            password: hashedPassword,
        });

        await user.save();

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/login', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.send('Invalid username or password');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.send('Invalid username or password');

        req.session.userId = user._id;

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

const upload = multer({ dest: 'uploads/' });

app.get('/dashboard', isAuth, async (req, res) => {
    try {
        const files = await File.find({ userId: req.session.userId });
        res.render('dashboard', { files });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/upload', isAuth, upload.single('file'), async (req, res) => {
    try {
        await File.create({
            filename: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            uploadDate: new Date(),
            userId: req.session.userId,
        });
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/download/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).send('File not found');

        res.download(file.path, file.filename);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/delete/:id', isAuth, async (req, res) => {
    try {
        const file = await File.findOne({
            _id: req.params.id,
            userId: req.session.userId,
        });
        if (!file) return res.status(404).send('File not found');

        fs.unlink(file.path, (err) => {
            if (err) console.error('File delete error:', err);
        });

        await File.findByIdAndDelete(req.params.id);

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/api/files', async (req, res) => {
    res.json(await File.find());
});

app.post('/api/files', async (req, res) => {
    res.json(await File.create(req.body));
});

app.put('/api/files/:id', async (req, res) => {
    res.json(await File.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});

app.delete('/api/files/:id', async (req, res) => {
    res.json(await File.findByIdAndDelete(req.params.id));
});

app.listen(3000, () => console.log('Server running on port 3000'));
