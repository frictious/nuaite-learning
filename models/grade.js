const   mongoose                = require("mongoose");

const gradeSchema = new mongoose.Schema({
    programName: String,
    moduleName : String,
    creditHour : {
        type : Number,
        default : 3
    },
    grade : String,
    studentID: Number,
    studentName : String,
    year: Number,
    semester: String,
    academicYear : String,
    point : Number,
    remarks: String
});

module.exports = mongoose.model("Grade", gradeSchema);