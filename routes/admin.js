const   express                 = require("express"),
        User                    = require("../models/user"),
        Department              = require("../models/department"),
        Program                 = require("../models/program"),
        Course                  = require("../models/course"),
        Grade                   = require("../models/grade"),
        Note                    = require("../models/note"),
        Assignment              = require("../models/assignment"),
        Quiz                    = require("../models/quiz"),
        passport                = require("passport"),
        nodemailer              = require("nodemailer"),
        mongoose                = require("mongoose"),
        bcrypt                  = require("bcryptjs"),
        crypto                  = require("crypto"),
        path                    = require("path"),
        multer                  = require("multer"),
        GridFsStorage           = require("multer-gridfs-storage"),
        Grid                    = require("gridfs-stream");
const { update } = require("../models/user");
const router = express.Router();

//CONFIG
//Nodemailer configuration
const transport = nodemailer.createTransport({
    service : "gmail",
    auth:{
        type: "login",
        user: "njalaelearning@gmail.com",
        pass: "elearning"
    }
});

//GRIDFS File db connection
const URI = "mongodb+srv://project:project@njalae-learning-image.4xafn.mongodb.net/njalae-learning-image?retryWrites=true&w=majority";
const conn = mongoose.createConnection(URI, {
    useNewUrlParser : true,
    useUnifiedTopology : true
});

//GRIDFS CONFIG FOR IMAGES
let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("files");
});

//GRIDFS STORAGE CONFIG
const storage = new GridFsStorage({
    url: URI,
    options : {useUnifiedTopology : true},
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
            if (err) {
                return reject(err);
            }
            const filename = buf.toString('hex') + path.extname(file.originalname);
            const fileInfo = {
                filename: filename,
                bucketName: "files"
            };
            resolve(fileInfo);
            });
        });
    }
});

//Multer config for images
const files = multer({ storage });

//Login checker
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        if(req.user.role.length === 5){
            return next();
        }else{
            res.redirect("/admin/logout");
        }
    }else{
        res.redirect("/admin/login");
    }
};

//Uploading multiple departmental files
const cpUpload = files.fields([{ name: 'photo', maxCount: 1 }, { name: 'activity', maxCount: 1 }]);

//ROUTES
router.get("/", isLoggedIn, (req, res) => {
    res.render("admin/dashboard", {
        title : "Admin dashboard section",
        description : "Njala E-Learning Admin Dashboard Section"
    });
});

//REGISTRATION SECTION
//===================================================================================
//Student Registration Route
router.get("/studentRegistration", (req, res) => {
    Department.find({}, (err, departments) => {
        if(departments){//Ensuring a department exist to add a student
            Program.find({}, (err, programs) => {
                if(programs){//Ensuring a program exist to enroll a student in
                    Course.find({}, (err, courses) => {
                        if(courses){//Ensuring a course exist to add a student to
                            res.render("admin/studentRegistration", {
                                title: "Registration of student and admin",
                                description : "Registering both admins and or students",
                                programs: programs,
                                departments : departments,
                                courses : courses
                            });
                        }
                    });             
                }
            });
        }
    });
});

//Student Registration Route Logic
router.post("/studentRegistration", (req, res) => {
    const id = Number(req.body.studentID);
    Department.find({}, (err, departments) => {
        if(departments){
            Program.find({}, (err, programs) => {
                if(programs){
                    Course.find({}, (err, courses) => {
                        if(courses){
                            User.findOne({
                                email : req.body.email
                            }, (err, foundUser) => {
                                if(foundUser){
                                    req.flash("error", "EMAIL / ID ALREADY EXIST");
                                    res.redirect("/admin/studentRegistration");
                                }else{
                                    if(req.body.password === req.body.repassword){
                                        bcrypt.genSalt(10)
                                        .then(salt => {
                                            bcrypt.hash(req.body.password, salt)
                                            .then(hash => {
                                                User.create({
                                                    name : req.body.name,
                                                    studentID : req.body.studentID,
                                                    email : req.body.email,
                                                    password : hash,
                                                    program : req.body.program,
                                                    department : req.body.department,
                                                    year : req.body.year,
                                                    role : "Student"
                                                }, (err, user) => {
                                                    if(user){
                                                        //Adding student to the department
                                                        Department.findOne({
                                                            name : req.body.department
                                                        }, (err, department) => {
                                                            if(department){
                                                                department.students.push(user);
                                                                department.save();
                                                            }else{
                                                                req.flash("error", "DEPARTMENT NOT FOUND");
                                                            }
                                                        });
                                
                                                        //Adding student to a program
                                                        Program.findOne({
                                                            name : req.body.program
                                                        }, (err, program) => {
                                                            if(program){
                                                                program.students.push(user);
                                                                program.save();
                                                            }else{
                                                                req.flash("error", "PROGRAM NOT FOUND");
                                                            }
                                                        });
                        
                                                        //Adding student to a course
                                                        Course.find({
                                                            programName : req.body.program
                                                        }, (err, course) => {
                                                            if(course){
                                                                if(course.year === user.year){
                                                                    course.students.push(user);
                                                                    course.save();
                                                                }
                                                            }else{
                                                                req.flash("error", "COURSE NOT FOUND");
                                                            }
                                                        });
                                                        
                                                        //Send mail to student after successful registration
                                                        const mailOptions = {
                                                            from: "njalaelearning@gmail.com",
                                                            to: req.body.email,
                                                            subject : `Njala Student Portal Registration Information`,
                                                            html: `<p>Dear <strong>${req.body.name}</strong>,</p>
                                                            <p>This email is to inform you that you have been registered into the Njala E-Learning portal.</p>
                                                            <p>Your id is: <strong>${req.body.studentID}</strong>.</p>
                                                            <p>Your email is <strong>${req.body.email}</strong>.</p>
                                                            <p>And your password is <strong>${req.body.password}</strong>.</p>
                                                            <p>Please keep your login information private. If you so wish to change
                                                            your password for security purposes, you can do so via the portal</p>
                                                            <p>Bear in  mind that if you loose the new password, you will have to pay
                                                            <strong>Le 50,000</strong> for your password to be changed</p>
                                                            <br><br>
                                                            <p>Sincerely</p>
                                                            <p>Registration Committee</p>`
                                                        }
                                
                                                        //Sending mail
                                                        transport.sendMail(mailOptions, (err, mail) => {
                                                            if(!err){
                                                                res.redirect("/registration");
                                                            }else{
                                                                console.log(err);
                                                            }
                                                        });
                                                        req.flash("success", "REGISTRATION SUCCESSFUL");
                                                        res.redirect("/admin/studentRegistration");
                                                    }else{
                                                        console.log(err);
                                                    }
                                                });
                                            })
                                        }).catch(err => {
                                            if(err){
                                                console.log(err);
                                            }
                                        });
                                    }
                                }
                            });        
                        }
                    });
                }
            });
        }
    });

    //Checking if the user is already registered
    
});

//Updating student information
router.get("/student/:id/edit", (req, res) => {
    // Department.find({}, (err, departments) => {
    //     if(departments){
    //         Program.find({}, (err, programs) => {
    //             if(programs){
                    User.findOne({_id : req.params.id}, (err, student) => {
                        if(student){
                            res.render("admin/updateStudent", {
                                title : "Update student information",
                                description : "Updating student information",
                                student : student,
                                // departments : departments,
                                // programs : programs
                            });
                        }
                    });
        //         }
        //     });
        // }
    // });
});

//Updating student information logic
router.put("/student/:id/edit", (req, res) => {
    User.updateOne({_id : req.params.id}, {
        name : req.body.name,
        studentID : req.body.studentID,
        email : req.body.email,
        year : req.body.year,
        // program : req.body.program,
        // department : req.body.department 
    }, (err, updatedStudent) => {
        if(updatedStudent){
            // Department.findOneAndUpdate({
            //     name : req.body.department
            //     // $pull : {students : {_id : req.params.id}}
            // }, (err, department) => {
            //     if(department){
            //         department.students.push(updatedStudent);
            //         department.save();
            //         console.log("STUDENT ADDED TO DEPARTMENT");
            //     }else{
            //         console.log("DEPARTMENT NOT FOUND");
            //     }
            // });

            // Program.findOne({name : req.body.program}, (err, program) => {
            //     if(program){
            //         program.students.push(updatedStudent);
            //         program.save();
            //         console.log("STUDENT ADDED TO PROGRAM");
            //     }else{
            //         console.log("PROGRAM NOT FOUND");
            //     }
            // });
            
            req.flash("success", "Student Information Updated Successfully");
            res.redirect("/admin/students/");
        }
    });
});

//Student Delete Route
router.delete("/student/:id", (req, res) => {
    User.deleteOne({_id : req.params.id}, (err) => {
        if(!err){
            req.flash("success", "Student Information Deleted Successfully");
            res.redirect("back");
        }
    });
});

//Show all students
router.get("/students", (req, res) => {
    User.find({
        role : "Student"
    }, (err, students) => {
        if(students){
            res.render("admin/students", {
                title : "Showing all students in the system",
                description : "Students that have been registered",
                students : students
            });
        }
    });
});

//Updating students information
router.get("/students/:id/edit", (req, res) => {
    User.findOne({_id : req.params.id}, (err, student) => {
        if(student){
            res.render("admin/updateStudent", {
                title : "Updating students information",
                description : "Updating student's name and or information",
                student : student
            });
        }
    });
});

//Updating students information logic route
router.put("/students/:id/edit", (req, res) => {
    User.updateOne({_id : req.params.id}, {
        name : req.body.name,
        studentID : req.body.studentID,
        email : req.body.email,
        year : req.body.year
    }, (err, student) => {
        if(student){
            req.flash("success", "STUDENT INFORMATION UPDATED SUCCESSFULLY");
            res.redirect("/admin/students");
        }else{
            console.log(err);
            res.redirect("back");
        }
    });
});

//Admin Registration Route
router.get("/adminRegistration", (req, res) => {
    res.render("admin/adminRegistration", {
        title: "Registration of student and admin",
        description : "Registering both admins and or students"
    });
});

//Admin Registration Logic Route
router.post("/adminRegistration", (req, res) => {
    if(req.body.password === req.body.repassword){
        bcrypt.genSalt(10)
        .then(salt => {
            bcrypt.hash(req.body.password, salt)
            .then(hash => {
                User.create({
                    name : req.body.name,
                    email: req.body.email,
                    password: hash,
                    role: "Admin"
                }, (err, admin) =>{
                    if(admin){
                        req.flash("success", "REGISTRATION SUCCESSFUL");
                        res.redirect("/admin");
                    }else{
                        console.log(err);
                    }
                });
            })
            .catch(err => {
                if(err){
                    console.log(err);
                }
            })
        });
    }else{
        req.flash("error", "PASSWORDS DO NOT MATCH");
        res.redirect("back");
    }
});

//Show all students
router.get("/admins", (req, res) => {
    User.find({
        role : "Admin"
    }, (err, admins) => {
        if(admins){
            res.render("admin/admin", {
                title : "Showing all admins in the system",
                description : "Admins that have been registered",
                admins : admins
            });
        }
    });
});

//Updating students information
router.get("/admin/:id/edit", (req, res) => {
    User.findOne({_id : req.params.id}, (err, admin) => {
        if(admin){
            res.render("admin/updateAdmin", {
                title : "Updating admin information",
                description : "Updating admin's name and or information",
                admin : admin
            });
        }
    });
});

//Updating admin information logic route
router.put("/admin/:id/edit", (req, res) => {
    User.updateOne({_id : req.params.id}, {
        name : req.body.name,
        email : req.body.email
    }, (err, admin) => {
        if(admin){
            req.flash("success", "ADMIN INFORMATION UPDATED SUCCESSFULLY");
            res.redirect("/admin/admins");
        }else{
            console.log(err);
            res.redirect("back");
        }
    });
});

//Deleting admin
router.delete("/admin/:id", (req, res) => {
    User.deleteOne({_id : req.params.id}, (err) => {
        if(err){
            req.flash("error", "Cannot delete admin");
            res.redirect("back");
        }else{
            req.flash("success", "Successfully Deleted Admin");
            res.redirect("back");
        }
    });
});

//Login Route
router.get("/login", (req, res) => {
    res.render("admin/login", {
        title : "Njala E-Learning Platform Admin Login page",
        description : "Login in to Njala E-Learning platform Admin area"
    });
});

//Login Route Logic
router.post("/login", (req, res, next) => {
    passport.authenticate("local", {
        successRedirect : "/admin",
        failureRedirect : "/admin/login"
    })(req, res, next);
});

//Logout Route
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Logged you out");
    res.redirect("/admin");
});

//Reset Password Route
router.get("/resetPassword", (req, res) => {
    res.render("admin/forgotPassword", {
        title : "Reseting Password",
        description : "Resetting the password of a user(Student / Admin)"
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
                    email : req.body.email
                }, {
                    password : hash
                }, (err, updatedPassword) => {
                    if(updatedPassword){
                        req.flash("success", "PASSWORD UPDATED SUCCESSFULLY");
                        res.redirect("/login");
                    }else{
                        req.flash("error", "EMAIL IS INCORRECT");
                        console.log(err);
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

//END OF REGISTRATION SECTION
//===================================================================================

//Department Get Form Route
router.get("/department/add", (req, res) => {
    res.render("admin/addDepartment", {
        title : "Creating a department",
        description: "Creating a department and adding it to the system"
    });
});

//Department add route
router.post("/department/add", cpUpload, (req, res) => {
    Department.findOne({name : req.body.name}, (err, department) => {
        if(department){
            req.flash("error", "DEPARTMENT EXISTS");
            res.redirect("/admin/department/add");
        }else{
            Department.create({
                name : req.body.name,
                HODName : req.body.HODName,
                DeanName: req.body.deanName,
                photo: req.files['photo'][0].filename,
                activities : req.files['activity'][0].filename,
                description: req.body.desc
            }, (err, department) => {
                if(department){
                    req.flash("success", "Department Added Successfully");
                    res.redirect("/admin/department");
                }else{
                    console.log(err);
                }
            });
        }
    })
});

//Department view route
router.get("/department", (req, res) => {
    Department.find({}, (err, departments) => {
        if(departments){
            res.render("admin/department", {
                title : "All departments in the system",
                description : "Showing all departments in the system",
                departments : departments
            });
        }else{
            console.log(err);
        }
    });
});

//Show Department route
router.get("/department/:id", (req, res) => {
    Department.findOne({_id : req.params.id}, (err, foundDepartment) => {
        if(foundDepartment){
            res.render("admin/showDepartment", {
                title : `Showing ${foundDepartment.name}`,
                description: `Showing ${foundDepartment.name} information`,
                department : foundDepartment
            });
        }else{
            console.log(err);
        }
    });
});

//Edit Department form route
router.get("/department/:id/edit", (req, res) => {
    Department.findOne({_id : req.params.id}, (err, foundDepartment) => {
        if(foundDepartment){
            res.render("admin/updateDepartment", {
                title : `Showing ${foundDepartment.name}`,
                description: `Showing ${foundDepartment.name} information`,
                department : foundDepartment
            });
        }else{
            console.log(err);
        }
    });
});

//Department update route logic
router.put("/department/:id/edit", (req, res) => {
    Department.updateOne({_id : req.params.id}, {
        name : req.body.name,
        HODName : req.body.HODName,
        DeanName: req.body.deanName,
        // activities: req.file.filename,
        description: req.body.desc
    }, (err, updatedDepartment) => {
        if(updatedDepartment){
            req.flash("success", "Department Update Successful");
            res.redirect("/admin/department");
        }else{
            req.flash("error", "Department Update Unsuccessful");
            res.redirect("/department");
        }
    })
});

//Department delete route
router.delete("/department/:id", (req, res) => {
    Department.deleteOne({_id : req.params.id}, (err) => {
        if(!err){
            req.flash("success", "Department Delete Successful");
            res.redirect("back");
        }else{
            req.flash("error", "Department Delete Unsuccessful");
            console.log(err);
        }
    });
});
//End of Department Section
//===================================================================================

//===================================================================================
//Program Get Form Route
router.get("/program/add", (req, res) => {
    Department.find({}, (err, department) => {
        if(department){
            res.render("admin/addProgram", {
                title : "Adding a program",
                description: "Add a program to the system",
                departments : department
            });
        }
    });
});

//Program add logic route
router.post("/program/add", files.single("timetable"), (req, res) => {
    Department.findOne({
        name : req.body.departName
    }, (err, found) => {
        if(found){
            Program.findOne({name : req.body.name}, (err, programFound) => {
                if(programFound){
                    req.flash("error", "THIS PROGRAM ALREADY EXIST IN THIS DEPARTMENT");
                    res.redirect("/admin/program/add");
                }
            });
        }else{
            if(req.file.mimetype === "application/pdf"){
                Program.create({
                    name : req.body.name,
                    duration : req.body.duration,
                    timetable : req.file.filename,
                    departmentName: req.body.departmentName,
                    description : req.body.description
                }, (err, program) => {
                    if(program){
                        Department.findOne({name : req.body.departmentName}, (err, foundDepartment) => {
                            if(foundDepartment){
                                foundDepartment.programs.push(program);//Adding the newly created program to a department
                                foundDepartment.save();//Saving the new addition
                                req.flash("success", "Program Added Successfully");
                                res.redirect("/admin/program/add");
                            }else{
                                console.log(err);
                            }
                        });
                    }else{
                        console.log(err);
                    }
                });   
            }else{
                req.flash("error", "TIMETABLE MUST BE A PDF FILE");
                res.redirect("/admin/program/add");
            }
        }
    })
});

//Program view route
router.get("/program", (req, res) => {
    Program.find({}, (err, programs) => {
        if(programs){
            res.render("admin/program", {
                title : "All programs in the system",
                description : "Showing all programs in the system",
                programs : programs
            });
        }else{
            console.log(err);
        }
    });
});

//Show Program route
router.get("/program/:id", (req, res) => {
    Program.findOne({_id : req.params.id}, (err, foundProgram) => {
        if(foundProgram){
            res.render("admin/showProgram", {
                title : `Showing ${foundProgram.name}`,
                description: `Showing ${foundProgram.name} information`,
                program : foundProgram
            });
        }else{
            console.log(err);
        }
    });
});

//Update PROGRAM route form
router.get("/program/:id/edit", (req, res) => {
    Program.findOne({_id : req.params.id}, (err, foundProgram) => {
        if(foundProgram){
            Department.find({}, (err, foundDepartment) => {
                if(foundDepartment){
                    res.render("admin/updateProgram", {
                        title : `Showing ${foundProgram.name}`,
                        description: `Showing ${foundProgram.name} information`,
                        program : foundProgram,
                        department : foundDepartment
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

//Program update route
router.put("/program/:id/edit", (req, res) => {
    Program.updateOne({_id : req.params.id}, {
        name : req.body.name,
        duration : req.body.duration,
        description : req.body.description
    }, (err, updatedProgram) => {
        if(updatedProgram){
            req.flash("success", "PROGRAM INFORMATION UPDATED");
            res.redirect("/admin/program");
        }else{
            req.flash("error", "Program Update Unsuccessful");
            res.redirect("/admin/program");
        }
    });
});

//Program delete route
router.delete("/program/:id", (req, res) => {
    //Finding the file in the gridfs storage and removing it
    Program.findOne({_id : req.params.id}, (err, foundProgram) => {
        if(foundProgram){
            gfs.files.findOne({filename : foundProgram.timetable}, (err, file) => {
                if(file){
                    gfs.files.remove({filename : file.filename, root : "files"}, (err) => {
                        if(err){
                            console.log(err);
                        }else{
                            //Program deleted successfully
                            Program.deleteOne({_id : req.params.id}, (err,) => {
                                if(!err){
                                    req.flash("success", "Program Deleted Successfully");
                                    res.redirect("/admin/program");
                                }else{
                                    console.log(err);
                                }
                            });
                        }
                    });
                }else{
                    console.log(err);
                }
            });
        }
    });
});
//END OF PROGRAM SECTION
//===================================================================================

//===================================================================================
//course Section
//course Get Form Route
router.get("/course/add", (req, res) => {
    //Searching for all programs and populating the dropdown option with the different programs
    Program.find({}, (err, programs) => {
        if(programs){
            res.render("admin/addCourse", {
                title : "Adding a course",
                description: "Add a course to a Program",
                programs : programs
            });
        }
    });
});

//Course add logic route
router.post("/course/add", files.single("curriculum"), (req, res) => {
    Course.create({
        courseName : req.body.name,
        courseCode : req.body.courseCode,
        programName: req.body.programName,
        curriculum : req.file.filename,
        year : req.body.year,
        semester : req.body.semester,
        lecturer : req.body.lecturer,
        creditHour : req.body.creditHour
    }, (err, course) => {
        if(course){
            Program.findOne({name : req.body.programName}, (err, foundProgram) => {
                if(foundProgram){
                    foundProgram.courses.push(course);//Adding the newly created course to a program
                    foundProgram.save();//Saving the new addition
                    req.flash("success", "Course Added Succesfully");
                    res.redirect("/admin/course/add");
                }else{
                    console.log(err);
                }
            });
        }else{
            req.flash("error", "Error Adding Course");
            console.log(err);
        }
    });
});

//course view rouMobile Computingte
router.get("/course", (req, res) => {
    Course.find({}, (err, courses) => {
        if(courses){
            res.render("admin/course", {
                title : "All courses in the system",
                description : "Showing all courses in the system",
                course : courses
            });
        }else{
            console.log(err);
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
                            Quiz.find({courseName : foundCourse.courseName}, (err, quiz) => {
                                if(quiz){
                                    res.render("admin/showCourse", {
                                        title : `Showing ${foundCourse.courseName}`,
                                        description: `Showing ${foundCourse.name} information`,
                                        course : foundCourse,
                                        notes : notes,
                                        assignments : assignments,
                                        quiz : quiz
                                    });
                                }else{
                                    res.render("admin/showCourse", {
                                        title : `Showing ${foundCourse.courseName}`,
                                        description: `Showing ${foundCourse.name} information`,
                                        course : foundCourse,
                                        notes : notes,
                                        assignments : assignments
                                    });
                                }
                            });
                        }else{
                            res.render("admin/showCourse", {
                                title : `Showing ${foundCourse.name}`,
                                description: `Showing ${foundCourse.name} information`,
                                course : foundCourse,
                                notes : notes
                            });
                        }
                    })
                }else{
                    res.render("admin/showCourse", {
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

//Course update form route
router.get("/course/:id/edit", (req, res) => {
    Course.findOne({_id : req.params.id}, (err, foundCourse) => {
        if(foundCourse){
            res.render("admin/updateCourse", {
                title : `Showing ${foundCourse.name}`,
                description: `Showing ${foundCourse.name} information`,
                course : foundCourse,
            });
        }else{
            console.log(err);
        }
    });
});

//Course update route
router.put("/course/:id/edit", (req, res) => {
    Course.updateOne({_id : req.params.id}, {
        courseName : req.body.name,
        courseCode : req.body.courseCode,
        year : req.body.year,
        semester : req.body.semester,
        lecturer : req.body.lecturer,
        creditHour : req.body.creditHour
    }, (err, updatedCourse) => {
        if(updatedCourse){
            req.flash("success", "Course Updated Successfully");
            res.redirect(`/admin/course/${req.params.id}`);
        }else{
            req.flash("error", "Course Update Unsuccessful");
            console.log(err);
            res.redirect("back");
        }
    })
});

//course delete route
router.delete("/course/:id", (req, res) => {
    //Deleting course note(s) and assignment(s)
    Course.findOne({_id : req.params.id}, (err, course) => {
        if(course){
            Note.find({courseName : course.courseName}, (err, note) => {
                if(note){
                    Note.deleteMany({_id : note._id}, (err) => {
                        if(!err){
                            console.log("NOTES DELETED");
                        }
                    });
                }
            });
            Assignment.find({courseName : course.courseName}, (err, assignment) => {
                if(assignment){
                    Assignment.deleteMany({_id : assignment._id}, (err) => {
                        if(!err){
                            console.log("ASSIGNMENTS DELETED");
                        }
                    });
                }
            });
        }
    });

    //Deleting course
    Course.deleteOne({_id : req.params.id}, (err) => {
        if(!err){
            req.flash("success", "COURSE DELETED SUCCESSFULLY");
            res.redirect("/admin/course");
        }else{
            req.flash("error", "Course Delete Unsuccessful");
            console.log(err);
        }
    });
});
//END OF course SECTION
//NOTES SECTION
//ADD NOTE
router.get("/note", (req, res) => {
    Course.find({}, (err, course) => {
        if(course){
            res.render("admin/addNote", {
                title : "Add students note",
                description : "Addition of students note",
                course : course
            });
        }else{
            req.flash("error", "No Course Found");
        }
    });
});

//Add note logic
router.post("/note/add", files.single("note"), (req, res) => {
    Course.findOne({courseName : req.body.courseName}, (err, course) => {
        if(course){
            Note.create({
                courseName : req.body.courseName,
                note : req.file.filename,
                year : req.body.year
            }, (err, note) => {
                if(note){
                    course.notes.push(note);
                    course.save();
                    req.flash("success", "NOTE ADDED SUCCESSFULLY");
                    res.redirect("/admin/course");
                }
            });
        }
    });
});

//DELETE NOTE
router.delete("/note/:id", (req, res) => {
    Note.deleteOne({_id : req.params.id}, (err) => {
        if(!err){
            req.flash("success", "NOTE DELETED SUCCESSFULLY");
            res.redirect("back");
        }
    });
});

//ASSIGNMENT SECTION
//ADD ASSIGNMENT
router.get("/assignment", (req, res) => {
    Course.find({}, (err, course) => {
        if(course){
            res.render("admin/addAssignment", {
                title : "Add students assignment",
                description : "Assigning course assignment",
                course : course
            });
        }else{
            req.flash("error", "No Course Found");
            res.redirect("back");
        }
    });
});

//Add assignment logic
router.post("/assignment/add", files.single("assignment"), (req, res) => {
    Course.findOne({courseName : req.body.courseName}, (err, course) => {
        if(course){
            Assignment.create({
                courseName : req.body.courseName,
                assignment : req.file.filename,
                year : req.body.year,
                instructions : req.body.instructions,
                submissionDate : req.body.submissionDate
            }, (err, assignment) => {
                if(assignment){
                    course.assignments.push(assignment);
                    course.save();
                    req.flash("success", "ASSIGNMENT ADDED SUCCESSFULLY");
                    res.redirect("/admin/course");
                }
            });
        }
    });
});

//DELETE ASSIGNMENT
router.delete("/assignment/:id", (req, res) => {
    Assignment.deleteOne({_id : req.params.id}, (err) => {
        if(!err){
            req.flash("success", "ASSIGNMENT DELETED SUCCESSFULLY");
            res.redirect("back");
        }
    });
});

//QUIZ SECTION
//ADD QUIZ
router.get("/quiz", (req, res) => {
    Course.find({}, (err, course) => {
        if(course){
            res.render("admin/addQuiz", {
                title : "Add Past Question",
                description : "Addition of past questions",
                course : course
            });
        }else{
            req.flash("error", "No Course Found");
        }
    });
});

//Add note logic
router.post("/quiz/add", files.single("quiz"), (req, res) => {
    Course.findOne({courseName : req.body.courseName}, (err, course) => {
        if(course){
            Quiz.create({
                courseName : req.body.courseName,
                quiz : req.file.filename,
                year : req.body.year,
                examYear : req.body.year
            }, (err, quiz) => {
                if(quiz){
                    course.quiz.push(quiz);
                    course.save();
                    req.flash("success", "QUESTION ADDED SUCCESSFULLY");
                    res.redirect("/admin/course");
                }
            });
        }
    });
});

//DELETE NOTE
router.delete("/quiz/:id", (req, res) => {
    Quiz.deleteOne({_id : req.params.id}, (err) => {
        if(!err){
            req.flash("success", "QUESTION DELETED SUCCESSFULLY");
            res.redirect("back");
        }
    });
});
//===================================================================================

//Files
// router.get("/files", (req, res) => {
//     gfs.files.find().toArray((err, allFiles) => {
//         if(allFiles){
//             res.json(allFiles);
//         }
//     });
// });

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

//Search form
router.get("/search", (req, res) => {
    Department.find({}, (err, department) => {
        if(department){
            Program.find({}, (err, program) => {
                if(program){
                    Course.find({}, (err, courses) => {
                        if(courses){
                            User.find({role : "Student"}, (err, students) => {
                                if(students){
                                    res.render("admin/search", {
                                        title : "Search Form",
                                        description : "App search form",
                                        department : department,
                                        program : program,
                                        course : courses,
                                        student : students
                                    });
                                }else{
                                    req.flash("error", "STUDENT NOT FOUND");
                                    res.redirect("back");
                                }
                            });
                        }else{
                            req.flash("error","MODULE NOT FOUND");
                            res.redirect("back");
                        }
                    });
                }else{
                    req.flash("error", "PROGRAM NOT FOUND");
                    res.redirect("back");
                }
            });
        }else{
            req.flash("error", "DEPARTMENT NOT FOUND");
            res.redirect("back");
        }
    });
});

//Search form post route
router.post("/search", (req, res) => {
    Department.findOne({name : req.body.department}, (err, department) => {
        if(department){
            Program.findOne({name : req.body.program}, (err, program) => {
                if(program){
                    if(program.departmentName === department.name){
                        Course.find({programName : program.name}, (err, course) => {
                            if(course){
                                res.redirect(`/admin/${req.body.department}/${req.body.program}/${req.body.semester}/${req.body.year}`);
                                //res.send("GRADE INPUT BOXES CAN BE AUTOFILLED AS PREDICTED");
                            }
                        });
                    }else{
                        req.flash("error", "PROGRAM IS NOT IN THAT DEPARTMENT");
                        res.redirect("back");
                    }
                }
            });
        }else{
            req.flash("error", "DEPARTMENT NOT FOUND");
            res.redirect("back");
        }
    });
});

//Grade addition route
router.get("/:department/:program/:semester/:year", (req, res) => {
    Course.find({
        programName : req.params.program,
        semester : req.params.semester,
        year : req.params.year
    }, (err, courses) => {
        if(courses){
            res.render("admin/addGrade", {
                title : "Add grades for a student",
                description : "Add individual grades for students",
                courses : courses
            });
            // res.json(courses);
        }else{
            console.log("NO COURSE FOUND");
            res.redirect("back");
        }
    });
    // res.send("THIS WILL DEFINITELY WORK");
});

router.post("/grade/add", (req, res) => {
    Grade.create({
        programName: req.params.program,
        studentID: req.body.studentID,
        studentName : req.body.studentName,
        year: req.params.year,
        semester: req.params.semester,
        academicYear : req.body.academicYear,
        sgpa: req.body.sgpa,
        cgpa: req.body.cgpa,
        remarks: req.body.remarks
    }, (err, grade) => {
        if(grade){
            // console.log(grade);
            // console.log(req.body.grade);
            // grade.firstSemesterCourses.push(String(req.body.grade));
            // grade.save();
            console.log("GRADES ADDED SUCCESSFULLY");
            res.redirect("back");
        }
    });
});

//GRADE SECTION
//===================================================================================
//Grade Get Form Route
router.get("/grade/add", (req, res) => {
    Department.find({}, (err, departments) => {
        if(departments){
            res.render("admin/addGrade", {
                title : "Adding a student's Grade",
                description: "Add student grades to the system",
                departments : departments
            });
        }
    });
});

//Grade add logic route
router.post("/grade/add", files.single("timetable"), (req, res) => {
    console.log(req.file);
    Grade.create({
        programName : req.body.programName,
        studentID : req.body.studentID,
        year : req.body.year,
        semester : req.body.semester,
        gpa : req.body.gpa,
        cgpa : req.body.cgpa,
        remarks : req.body.remarks
    }, (err, grade) => {
        if(grade){
            Program.findOne({name : req.body.departmentName}, (err, foundDepartment) => {
                if(foundDepartment){
                    foundDepartment.programs.push(program);//Adding the newly created program to a department
                    foundDepartment.save();//Saving the new addition
                    res.redirect("/admin/program/add");
                }else{
                    console.log(err);
                }
            });
        }else{
            console.log(err);
        }
    });
});

//Grade view route
router.get("/grade", (req, res) => {
    Grade.find({}, (err, grades) => {
        if(grades){
            res.render("admin/grade", {
                title : "All grades in the system",
                description : "Showing all grades in the system",
                grades : grades
            });
        }else{
            console.log(err);
        }
    });
});

//Show Grade route
router.get("/grade/:id", (req, res) => {
    Grade.findOne({_id : req.params.id}, (err, foundGrade) => {
        if(foundGrade){
            res.render("admin/showProgram", {
                title : `Showing ${foundGrade.name}`,
                description: `Showing ${foundGrade.name} information`,
                grades : foundGrade
            });
        }else{
            console.log(err);
        }
    });
});

//Update Grade route form
router.get("/grade/:id/edit", (req, res) => {
    Grade.findOne({_id : req.params.id}, (err, foundGrade) => {
        if(foundGrade){
            res.render("admin/updateProgram", {
                title : `Showing ${foundGrade.name}`,
                description: `Showing ${foundGrade.name} information`,
                grade : foundGrade
            });
        }else{
            console.log(err);
        }
    });
});

//Grade update route
router.put("/grade/:id/edit", (req, res) => {
    Grade.updateOne({_id : req.params.id}, {
        name : req.body.name,
        duration : req.body.duration,
        departmentName: req.body.departmentName,
        // timetable : req.file.filename
    }, (err, updatedProgram) => {
        if(updatedProgram){
            console.log("PROGRAM INFORMATION UPDATED");
            res.redirect(`/admin/department/${updatedProgram._id}`);
        }else{
            console.log(err);
            res.redirect("/department");
        }
    })
});

//Grade delete route
router.delete("/grade/:id", (req, res) => {
    Grade.deleteOne({_id : req.params.id}, (err) => {
        if(!err){
            res.redirect("admin/grade");
        }else{
            console.log(err);
        }
    });
});
//END OF GRADE SECTION
//===================================================================================
module.exports = router;