import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getMessaging } from "firebase-admin/messaging";
import express, { json, response } from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
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


setInterval(async (req, res) => {
  try {
    const apiUrl = "https://api.thingspeak.com/channels/2336234/feeds.json?api_key=ED1802UZPY1V5E5J&results=1"; // Replace with the actual API endpoint
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
},15000);

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
    }).then((response) => {
      res.status(200).json({
        message: "Successfully sent message",

      });
      console.log("Successfully sent message:", response);
    })
      .catch((error) => {
        res.status(400);
        res.send(error);
        console.log("Error sending message:", error);
      });
  }



  if (temp > 25 || temp < 22) {



    await getMessaging().send({
      notification: {
        title: "Temperature",
        body: "Threshold crossed",
      },
      token: "cfbyG9QYSvizvOzX6nphbG:APA91bGhozCWJkSgOHBBG3utPfwt9jShpQ9UriQAb3tLEkwgzoMOAZC0sjUlSGzR9z3OBG6VKl4z6dvOf-9zY6JDyXxVADEJqULImlAsR3tYDJYDphNEX6OFyEHHShAed9rBJnqagOy8",
    })
    
    // .then((response) => {
    //   res.status(200).json({
    //     message: "Successfully sent message",

    //   });
    //   console.log("Successfully sent message:", response);
    // })
    //   .catch((error) => {
    //     res.status(400);
    //     res.send(error);
    //     console.log("Error sending message:", error);
    //   });
  }

}




app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 5500");
});
