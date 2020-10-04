const   mongoose            = require("mongoose");

const assignmentSchema = new mongoose.Schema({
    courseName : String,
    assignment: String,
    year: Number,
    instructions: String,
    submissionDate: Date
});

module.exports = mongoose.model("Assignment", assignmentSchema);