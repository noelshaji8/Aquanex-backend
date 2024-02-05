import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getMessaging } from "firebase-admin/messaging";
import express, { json, response } from "express";
import cors from "cors";
import fetch from "node-fetch";
import CircularJSON from "circular-json";
import cron from "node-cron";

const app = express();

var newdata;
var ph
var temp;
var acval = false;
var automode = true;
var actno = 1;
var isDoneMotor = false;
var isDoneFeeder = false;

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


const notiTrigger = async (req, res, next) => {

  try {
    const apiUrl = "https://api.thingspeak.com/channels/2336234/feeds.json?api_key=ED1802UZPY1V5E5J&results=1";
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

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

    next();

  }

  catch (error) {
    console.error(error);
    res.status(500).send('Error fetching data');
  }


}


app.post('/send-acvalue', (req, res) => {

  newdata = req.body;
  acval = newdata["value"];
  automode = newdata["automode"];
  actno = newdata["actuator"];

  console.log(newdata);
  res.status(200).json(newdata);
});


app.get('/get-acvalue', notiTrigger, (req, res) => {

  //NOTIFIATIONs OCCUR ONLY ONCE EVERY 10 MINS SET AKKU

  if (automode) 
  {
    //console.log("auto");
    if (actno == 1) 
    {
      //console.log("Motor");
      if (!isDoneMotor) 
      {
        //console.log("reload done");
        if (ph > 5 || ph < 0 || temp > 25 || temp < 22) 
        {
          //console.log("value crossed");
          isDoneMotor = true;
          res.json(newdata);
          console.log(newdata);
          setTimeout(() => { isDoneMotor = false; }, 30000); // timeout of 4 hrs
          
          if(acval==true)
          {          
            getMessaging().send({
              notification: {
                title: "Motor",
                body: "Activated",
              },
              token: "cfbyG9QYSvizvOzX6nphbG:APA91bGhozCWJkSgOHBBG3utPfwt9jShpQ9UriQAb3tLEkwgzoMOAZC0sjUlSGzR9z3OBG6VKl4z6dvOf-9zY6JDyXxVADEJqULImlAsR3tYDJYDphNEX6OFyEHHShAed9rBJnqagOy8",
            });
          }
        }

      }
      else {
        //console.log("reload not done");
        res.status(409).send("reload Not Done");
      }
    }
    else if(actno=2)
    {
      //console.log("Feeder");
      if (!isDoneFeeder) 
      {
        //console.log("reload done");
        if (ph > 5 || ph < 0 || temp > 25 || temp < 22) 
        {
          //console.log("value crossed");
          isDoneFeeder = true;
          res.json(newdata);
          console.log(newdata);
          setTimeout(() => { isDoneFeeder = false; }, 60000); // timeout of 12 hrs

          if(acval==true)
          {          
            getMessaging().send({
              notification: {
                title: "Feeder",
                body: "Activated",
              },
              token: "cfbyG9QYSvizvOzX6nphbG:APA91bGhozCWJkSgOHBBG3utPfwt9jShpQ9UriQAb3tLEkwgzoMOAZC0sjUlSGzR9z3OBG6VKl4z6dvOf-9zY6JDyXxVADEJqULImlAsR3tYDJYDphNEX6OFyEHHShAed9rBJnqagOy8",
            })
          }
        }

      }
      else {
        res.status(409).send("reload Not Done");
      }
    }

  }
  else {
    //console.log("not auto");
    res.json(newdata);
    console.log(newdata);
  }

});




app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
