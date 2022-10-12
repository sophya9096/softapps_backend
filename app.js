const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const https = require("https");

const HttpError = require("./models/http-error").HttpError;

const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads/images", express.static(path.join("uploads", "images")));
app.use("/uploads/files", express.static(path.join("uploads", "files")));
app.use(express.static(path.join("public")));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    next();
});

app.use("/user", userRoutes);

app.use((req, res, next) => {
    // res.sendFile(path.resolve(__dirname, "public", "index.html"));
    res.json({ message: "" });
});

app.use((req, res, next) => {
    const error = new HttpError("Route couldn't found", 404);
    throw error;
});

app.use((error, req, res, next) => {
    // if (req.file) {
    //     fs.unlink(req.file.path, (err) => {
    //         console.log(err);
    //     });
    // }
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

mongoose.set("useCreateIndex", true);
const mongooseOptions = {
    useNewUrlParser: true,
    // autoReconnect: true,
    // poolSize: 25,
    // connectTimeoutMS: 30000,
    // socketTimeoutMS: 30000,
    useUnifiedTopology: true,
};

mongoose
    .connect(
        `mongodb://root:${process.env.DB_PWD}@cluster0-shard-00-00-n7ejg.mongodb.net:27017,cluster0-shard-00-01-n7ejg.mongodb.net:27017,cluster0-shard-00-02-n7ejg.mongodb.net:27017/softapps?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority`,
        mongooseOptions,
    )
    .then((result) => {
        // var options = {
        //     key: fs.readFileSync("./server.key"),
        //     cert: fs.readFileSync("./server.crt"),
        // };
        // https.createServer(options, app).listen(process.env.PORT, function () {
        //     console.log(`SoftApps Listening on ${process.env.PORT}`);
        //     console.log(`Yo`);
        // });
        app.listen(process.env.PORT);
        console.log(`SoftApps Listening on ${process.env.PORT}`);
        console.log(`Yo`);
    })
    .catch((err) => {
        console.log("Error", err);
    });
