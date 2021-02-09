const   mongoose            = require("mongoose");

const quizSchema = new mongoose.Schema({
    courseName : String,
    quiz : String,
    yearTaken : String,
    year : Number,
});


module.exports = mongoose.model("Quiz", quizSchema);