const multer = require("multer");
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const fileAccept = (req, file, cb) => {
    const allowedFiles = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
    ];
    if (allowedFiles.includes(file.mimetype)) {
        cb(null, true);
    } else{
        cb(new Error("Only PDF, PNG, JPG, and JPEG files are accepted"), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileAccept,
});


module.exports = upload;
