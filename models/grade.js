const   mongoose                = require("mongoose");

const gradeSchema = new mongoose.Schema({
    programName: String,
    grades: [{
        moduleName : String,
        grade: String
    }],
    studentID: Number,
    year: Number,
    semester: String,
    creditHour : Number,
    gpa: Number,
    cgpa: Number,
    remarks: String
});

module.exports = mongoose.model("Grade", gradeSchema);