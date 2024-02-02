import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getMessaging } from "firebase-admin/messaging";
import express, { json, response } from "express";
import cors from "cors";
import fetch from "node-fetch";
import CircularJSON from "circular-json";
import cron from "node-cron";

const app = express();
var newdata;

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],

  })
);

app.use(function (req, res, next) {
  res.setHeader("Content-Type", "application/json");
  next();
});


initializeApp({
  credential: applicationDefault(),
  projectId: 'aquanex-cbd72',
});


app.post('/send-acvalue', (req, res) => {
  newdata = CircularJSON.stringify(req.body);

  res.status(200).json(newdata);
});


app.get('/get-acvalue', (req, res) => {

  res.json(newdata);

});

cron.schedule("*/10 * * * * *", async (res) => {

  try {
    const apiUrl = "https://api.thingspeak.com/channels/2336234/feeds.json?api_key=ED1802UZPY1V5E5J&results=1";
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(data);

    serviceFunction(data, res)

  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching data');
  }

});

// setInterval(async (req, res) => {
//   try {
//     const apiUrl = "https://api.thingspeak.com/channels/2336234/feeds.json?api_key=ED1802UZPY1V5E5J&results=1"; // Replace with the actual API endpoint
//     const response = await fetch(apiUrl);

//     if (!response.ok) {
//       throw new Error(`API request failed with status ${response.status}`);
//     }

//     const data = await response.json();
//     console.log(data);

//     serviceFunction(data, res)


//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error fetching data');
//   }
// }, 5000);

async function serviceFunction(data, res) {

  const temp = data["feeds"][0]["field1"];
  const ph = data["feeds"][0]["field2"];

  if (ph > 5 || ph < 0) {

    await getMessaging().send({
      notification: {
        title: "pH",
        body: "Threshold crossed",
      },
      token: "cfbyG9QYSvizvOzX6nphbG:APA91bGhozCWJkSgOHBBG3utPfwt9jShpQ9UriQAb3tLEkwgzoMOAZC0sjUlSGzR9z3OBG6VKl4z6dvOf-9zY6JDyXxVADEJqULImlAsR3tYDJYDphNEX6OFyEHHShAed9rBJnqagOy8",
    })

  }



  if (temp > 25 || temp < 22) {

    await getMessaging().send({
      notification: {
        title: "Temperature",
        body: "Threshold crossed",
      },
      token: "cfbyG9QYSvizvOzX6nphbG:APA91bGhozCWJkSgOHBBG3utPfwt9jShpQ9UriQAb3tLEkwgzoMOAZC0sjUlSGzR9z3OBG6VKl4z6dvOf-9zY6JDyXxVADEJqULImlAsR3tYDJYDphNEX6OFyEHHShAed9rBJnqagOy8",
    })
  }

}

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
