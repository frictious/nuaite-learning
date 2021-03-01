const   User                    = require("../models/user"),
        Department              = require("../models/department"),
        Program                 = require("../models/program"),
        bcrypt                  = require("bcryptjs"),
        Course                  = require("../models/course"),
        nodemailer              = require("nodemailer");

//CONFIG
require("dotenv").config();
//Nodemailer configuration
const transport = nodemailer.createTransport({
    service : "gmail",
    auth:{
        type: "login",
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

//Student Registration Route
exports.studentRegistration = (req, res) => {
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
};

//Student Registration Route Logic
exports.studentPostRegistration = (req, res) => {
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
    
};

//Updating student information
exports.editStudent = (req, res) => {
    User.findOne({_id : req.params.id}, (err, student) => {
        if(student){
            res.render("admin/updateStudent", {
                title : "Update student information",
                description : "Updating student information",
                student : student,
            });
        }
    });
};

//Updating student information logic
exports.editStudentPutRoute = (req, res) => {
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
};

//Student Delete Route
exports.deleteStudent = (req, res) => {
    User.deleteOne({_id : req.params.id}, (err) => {
        if(!err){
            req.flash("success", "Student Information Deleted Successfully");
            res.redirect("back");
        }
    });
};

//Show all students
exports.students = (req, res) => {
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
};

//Updating students information
// exports.updateSingleStudent = (req, res) => {
//     User.findOne({_id : req.params.id}, (err, student) => {
//         if(student){
//             res.render("admin/updateStudent", {
//                 title : "Updating students information",
//                 description : "Updating student's name and or information",
//                 student : student
//             });
//         }
//     });
// };

//Updating students information logic route
// exports.updateStudentsPutRoute = (req, res) => {
//     User.updateOne({_id : req.params.id}, {
//         name : req.body.name,
//         studentID : req.body.studentID,
//         email : req.body.email,
//         year : req.body.year
//     }, (err, student) => {
//         if(student){
//             req.flash("success", "STUDENT INFORMATION UPDATED SUCCESSFULLY");
//             res.redirect("/admin/students");
//         }else{
//             console.log(err);
//             res.redirect("back");
//         }
//     });
// };