const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, unique: true },
        watch: { type: Number, required: true, unique: true },
        desc: { type: String, required: true },
        thumbnail: { type: String },
        categories: { type: Array },
        tags: { type: Array },
        filePath: { type: String, required: true },
        price: { type: Number, required: true },
        views: { type: Number }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Content", ContentSchema);