const   mongoose                = require("mongoose");

const noteSchema = new mongoose.Schema({
    courseName : String,
    note: String,
    year: Number,
    originalName: String
});

module.exports = mongoose.model("Note", noteSchema);