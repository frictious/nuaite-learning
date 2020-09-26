const   express                 = require("express");
        // Authentication          = require("../models/authentication"),
        // passport                = require("passport");

const router = express.Router();

//CONFIG


//ROUTES
//Index Route
router.get("/", (req, res) => {
    res.render("index", {
        title : "Welcome to Njala E-Learning Platform",
        description: "Njala E-Learning Platform"
    });
});

//Registration Route
//Registration Route Logic

//Login Route
router.get("/login", (req, res) => {
    res.render("login", {
        title : "Njala E-Learning Platform Login page",
        description : "Login in to Njala E-Learning platform"
    });
});
//Login Route Logic
// router.post("/login", (req, res, next) => {
//     paassport.authenticate("local", {
//         successRedirect : "/",
//         failureRedirect : "/login"
//     })(req, res, next);
// });

//Department Route
router.get("/department", (req, res) => {
    res.render("department", {
        title : "E-Learning Platform Departmental page",
        description : "Njala Department"
    });
});

//Program Route
router.get("/program", (req, res) => {
    res.render("program", {
        title : "Student Program Information",
        description : "Njala E-Learning Student Program Info Section"
    });
});

//Module Route
//Grade Route
router.get("/grades", (req, res) => {
    res.render("grades", {
        title : "Student Grades Section",
        description : "Njala E-Learning Platform Grades Section"
    });
});

//About Route
router.get("/about", (req, res) => {
    res.render("about", {
        title : "About Njala E-Learning Platform",
        description : "About Njala E-Learning platform"
    });
});

module.exports = router;