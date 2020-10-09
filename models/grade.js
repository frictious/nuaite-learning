const   mongoose                = require("mongoose");

const gradeSchema = new mongoose.Schema({
    programName: String,
    // firstSemesterCourses: [{
    //     moduleName : String,
    //     creditHour : Number,
    //     grade: String
    // }],
    // secondSemesterCourses: [{
    //     moduleName : [String],
    //     creditHour : [String],
    //     grade: [String]
    // }],
    moduleName : String,
    creditHour : Number,
    grade : String,
    studentID: Number,
    studentName : String,
    year: Number,
    semester: String,
    academicYear : String,
    remarks: String
});

module.exports = mongoose.model("Grade", gradeSchema);