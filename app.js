const   express                 = require("express"),
        Index                   = require("./routes/index"),
        bodyParser              = require("body-parser");

const app = express();
require("dotenv").config();

//CONFIG
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.use("/", Index);

//Listening
app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});