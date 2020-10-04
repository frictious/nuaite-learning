const   express                 = require("express"),
        User                    = require("../models/user"),
        bcrypt                  = require("bcryptjs"),
        Department              = require("../models/department"),
        Program                 = require("../models/program"),
        Course                  = require("../models/course"),
        Grade                   = require("../models/grade"),
        Note                    = require("../models/note"),
        Assignment              = require("../models/assignment"),
        passport                = require("passport");

const router = express.Router();

//CONFIG

//Authentication checker
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        if(req.user.role === "Student"){
            return next();
        }else{
            console.log("YOU'RE NOT A STUDENT");
        }
    }else{
        res.redirect("/login");
    }
};

//ROUTES
//Index Route
router.get("/", (req, res) => {
    res.render("index", {
        title : "Welcome to Njala E-Learning Platform",
        description: "Njala E-Learning Platform"
    });
});

//Login Route
router.get("/login", (req, res) => {
    res.render("login", {
        title : "Njala E-Learning Platform Login page",
        description : "Login in to Njala E-Learning platform"
    });
});

//Login Route Logic
router.post("/login", (req, res, next) => {
    passport.authenticate("local", {
        successRedirect : "/",
        failureRedirect : "/login"
    })(req, res, next);
});

//Logout Route
router.get("/logout", isLoggedIn, (req, res) => {
    req.logOut();
    req.flash("success", "Logged you out");
    res.redirect("/");
});

//Reset Password Route
router.get("/resetPassword", (req, res) => {
    res.render("forgotPassword", {
        title : "Reset Student Password",
        description : "Resetting the password of a student"
    });
});

//Reset password route
router.put("/resetPassword", (req, res) => {
    if(req.body.password === req.body.retypePassword){
        bcrypt.genSalt(10)
        .then(salt => {
            bcrypt.hash(req.body.password, salt)
            .then(hash => {
                User.updateOne({
                    studentID : req.body.studentID,
                    email : req.body.email
                }, {
                    password : hash
                }, (err, updatedPassword) => {
                    if(updatedPassword){
                        req.flash("success", "PASSWORD UPDATED SUCCESSFULLY");
                        res.redirect("/login");
                    }else{
                        req.flash("error", "EMAIL OR ID IS INCORRECT");
                        res.redirect("/resetPassword");
                    }
                });
            })
        }).catch(err => {
            if(err){
                console.log(err);
            }
        });
    }
});

//Department Route
router.get("/department", isLoggedIn, (req, res) => {
    User.findOne({
        email: req.user.email
    }, (err, userDepartment) => {
        if(userDepartment){
            Department.find({name : userDepartment.department}, (err, departments) => {
                if(departments){
                    res.render("department", {
                        title : "E-Learning Platform Departmental page",
                        description : "Njala Department",
                        departments : departments
                    });
                }else{
                    console.log(err);
                }
            });
        }else{
            console.log(err);
        }
    });
});

//Program Route
router.get("/program", isLoggedIn, (req, res) => {
    User.findOne({
        email: req.user.email
    }, (err, user) => {
        if(user){
            Program.findOne({name : user.program}, (err, foundProgram) => {
                if(foundProgram){
                    Course.find({programName : foundProgram.name}, (err, courses) => {
                        if(courses){
                            Note.find({courseName : courses.name}, (err, notes) =>{
                                if(notes){
                                    Assignment.find({courseName : courses.name}, (err, assignments) => {
                                        if(assignments){
                                            res.render("program", {
                                                title : "Student Program Information",
                                                description : "Njala E-Learning Student Program Info Section",
                                                program : foundProgram,
                                                courses : courses,
                                                notes : notes,
                                                assignments : assignments
                                            });
                                        }else{
                                            res.render("program", {
                                                title : "Student Program Information",
                                                description : "Njala E-Learning Student Program Info Section",
                                                program : foundProgram,
                                                courses : courses,
                                                notes : notes
                                            });
                                        }
                                    });
                                }else{
                                    res.render("program", {
                                        title : "Student Program Information",
                                        description : "Njala E-Learning Student Program Info Section",
                                        program : foundProgram,
                                        courses : courses
                                    });
                                }
                            });
                        }else{
                            res.render("program", {
                                title : "Student Program Information",
                                description : "Njala E-Learning Student Program Info Section",
                                program : foundProgram
                            });
                        }
                    });
                }else{
                    console.log(err);
                }
            });
        }else{
            console.log(err);
        }
    });
});

//Module Route
router.get("/course", isLoggedIn, (req, res) => {
    Department.findOne({name : user.department}, (err, department) => {
        if(department){
            Program.findOne({name : user.program}, (err, program) => {
                if(program){
                    Course.find({programName : program.name}, (err, courses) => {
                        if(courses){
                            res.render("course", {
                                title : "Njala E-Learning Course Page",
                                description : "Njala E-Learning Course Information Page",
                                courses : courses
                            });
                        }
                    });
                }
            });
        }
    });
});

//Show course route
router.get("/course/:id", (req, res) => {
    Course.findOne({_id : req.params.id}, (err, foundCourse) => {
        if(foundCourse){
            Note.find({courseName : foundCourse.courseName}, (err, notes) => {
                if(notes){
                    Assignment.find({courseName : foundCourse.courseName}, (err, assignments) => {
                        if(assignments){
                            res.render("showCourse", {
                                title : `Showing ${foundCourse.name}`,
                                description: `Showing ${foundCourse.name} information`,
                                course : foundCourse,
                                notes : notes,
                                assignments : assignments
                            });
                        }else{
                            res.render("showCourse", {
                                title : `Showing ${foundCourse.name}`,
                                description: `Showing ${foundCourse.name} information`,
                                course : foundCourse,
                                notes : notes
                            });
                        }
                    })
                }else{
                    res.render("showCourse", {
                        title : `Showing ${foundCourse.name}`,
                        description: `Showing ${foundCourse.name} information`,
                        course : foundCourse
                    });
                }
            });
        }else{
            console.log(err);
        }
    });
});

//Getting the files
router.get("/files/:filename", (req, res) => {
    gfs.files.findOne({filename : req.params.filename}, (err, foundFiles) => {
        if(foundFiles){
            const readstream = gfs.createReadStream(foundFiles.filename);
            readstream.pipe(res);
        }else{
            console.log(err);
        }
    });
})

//Grade Route
router.get("/grades", isLoggedIn, (req, res) => {
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