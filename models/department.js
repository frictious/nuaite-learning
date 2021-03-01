const   mongoose            = require("mongoose"),
        User                = require("../models/user"),
        Program             = require("../models/program");

const departmentSchema = new mongoose.Schema({
    name : String,
    HODName : String,
    DeanName : String,
    programs : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Program"
    }],
    photo : String,
    activities : String,
    students : [{
        type: mongoose.Schema.Types.ObjectId,
        ref : "User"
    }],
    description: String,
    originalNameOne: String,
    originalNameTwo : String
});

module.exports = mongoose.model("Department", departmentSchema);