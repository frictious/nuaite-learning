const   express                 = require("express"),
        Index                   = require("./routes/index"),
        Admin                   = require("./routes/admin"),
        mongoose                = require("mongoose"),
        session                 = require("express-session"),
        passport                = require("passport"),
        methodOverride          = require("method-override"),
        flash                   = require("connect-flash"),
        bodyParser              = require("body-parser");

const app = express();
require("dotenv").config();
require("./config/login")(passport);

//CONFIG
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));

global.Promise = mongoose.Promise
mongoose.connect(process.env.MONGODB, {
    useUnifiedTopology: true,
    useNewUrlParser : true
});

//Express session configuration
app.use(session({
    secret : "Njala E-Learning Session",
    resave : false,
    saveUninitialized : false
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
})

app.use("/", Index);
app.use("/admin", Admin);

//Listening
app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});