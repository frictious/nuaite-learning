const   mongoose            = require("mongoose"),
        Assignment          = require("../models/assignment"),
        User                = require("../models/user"),
        Note                = require("../models/note");

const courseSchema = new mongoose.Schema({
    courseName : {
        type : String,
        required: true
    },
    courseCode: String,
    creditHour : Number,
    programName: String,
    notes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note"
    }],
    curriculum: String,
    assignments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment"
    }],
    year: Number,
    semester: String,
    lecturer: String,
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
});

module.exports = mongoose.model("Course", courseSchema);