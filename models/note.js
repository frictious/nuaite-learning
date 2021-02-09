const   mongoose                = require("mongoose");

const noteSchema = new mongoose.Schema({
    courseName : String,
    note: String,
    year: Number
});

module.exports = mongoose.model("Note", noteSchema);