const   mongoose            = require("mongoose"),
        User                = require("../models/user"),
        Course              = require("../models/course");

const programSchema = new mongoose.Schema({
    name : String,
    duration: Number,
    timetable: String,
    departmentName: String,
    students : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }],
    courses:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    }],
    description : String,
    originalName: String
});

module.exports = mongoose.model("Program", programSchema);