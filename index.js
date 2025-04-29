const express = require("express");
const app = express();

require("dotenv").config();
const host = process.env.HOST;

const cors = require("cors");

app.use(
  cors({
    origin: [
      "http://192.168.0.130:5173",
      "http://192.168.0.133:5173",
      "http://192.168.0.130:5174",
      "http://localhost:5173", 
      "https://restrorent.netlify.app"
    ],
    methods: ["GET", "POST", "HEAD", "PUT", "PATCH", "DELETE"],
    optionsSuccessStatus: 200,
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json());


require("./app/routes")(app);
require("./app/routes/media")(app);

app.get("/", (req, res) => {
  return res.status(200).send({
    error: false,
    message: "Welcome To Restaurant Api",
  });
});

const port = process.env.PORT || 5050;

app.listen(port, host, () =>
  console.log(`App is listening at port:http://${host}:${port}`)
);
