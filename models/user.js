const   mongoose        = require("mongoose");

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    studentID : Number,
    email: String,
    password: String,
    program: String,
    department: String,
    year: Number,
    role: {
        type : String,
        required : true
    }
});

module.exports = mongoose.model("User", userSchema);