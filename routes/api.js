const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const File = require("../models/File");

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage });


router.get("/files", async (req, res) => {
    const files = await File.find({});
    res.json(files);
});

router.get("/files/:id", async (req, res) => {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });
    res.json(file);
});

router.post("/files", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const newFile = await File.create({
        filename: req.file.originalname,
        path: req.file.filename,
        size: req.file.size
    });

    res.json({
        message: "File uploaded",
        file: newFile
    });
});

router.delete("/files/:id", async (req, res) => {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    await File.findByIdAndDelete(req.params.id);
    res.json({ message: "File deleted" });
});

module.exports = router;
