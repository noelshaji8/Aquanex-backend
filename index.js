import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getMessaging } from "firebase-admin/messaging";
import express, { json, response } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const { privateKey } = JSON.parse(process.env.CYCLIC_PRIVATE_KEY)

const app = express();

var newdata;
var ph;
var temp;
var data;

var acval = false;
var automode = true;
var actno = 1;

let MotoractnoToint;
let FeederactnoToint;

var previousTimeMotor = 0;
var eventIntervalMotor = 60;

var previousTimeFeeder = 0;
var eventIntervalFeeder = 60;

var previousTimeNotif = 0;
var eventIntervalNotif = 30;

var previousRunTimeFeeder;
var RunIntervalFeeder = 10;

var previousRunTimeMotor;
var RunIntervalMotor = 10;

let currentRunTimeMotor;
let currentRunTimeFeeder;


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
  credential: cert({
    projectId: process.env.CYCLIC_PROJECT_ID,
    clientEmail: process.env.CYCLIC_CLIENT_EMAIL,
    //privateKey: process.env.CYCLIC_PRIVATE_KEY
    privateKey: privateKey,
  }),

});



const notiTrigger = async (req, res, next) => {

  console.log("\n");

  let currentTimeNotif = Math.floor(Date.now() / 1000);

  if (currentTimeNotif - previousTimeNotif >= eventIntervalNotif) {
    console.log("notifs");

    previousTimeNotif = currentTimeNotif;

    try {
      const apiUrl = "https://api.thingspeak.com/channels/2336234/feeds.json?api_key=ED1802UZPY1V5E5J&results=1";
      let response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      data = await response.json();

      temp = data["feeds"][0]["field1"];
      ph = data["feeds"][0]["field2"];

      if (ph > 7.5 || ph < 6.5) {

        await getMessaging().send({
          notification: {
            title: "pH",
            body: "Threshold crossed",
          },
          token: "cfbyG9QYSvizvOzX6nphbG:APA91bGhozCWJkSgOHBBG3utPfwt9jShpQ9UriQAb3tLEkwgzoMOAZC0sjUlSGzR9z3OBG6VKl4z6dvOf-9zY6JDyXxVADEJqULImlAsR3tYDJYDphNEX6OFyEHHShAed9rBJnqagOy8",
        })

      }

      if (temp > 30 || temp < 22) {

        await getMessaging().send({
          notification: {
            title: "Temperature",
            body: "Threshold crossed",
          },
          token: "cfbyG9QYSvizvOzX6nphbG:APA91bGhozCWJkSgOHBBG3utPfwt9jShpQ9UriQAb3tLEkwgzoMOAZC0sjUlSGzR9z3OBG6VKl4z6dvOf-9zY6JDyXxVADEJqULImlAsR3tYDJYDphNEX6OFyEHHShAed9rBJnqagOy8",
        })
      }



    }

    catch (error) {
      console.error(error);
      res.status(500).send('Error fetching data');
    }


  }
  else {
    console.log("no notifs");
  }

  next();
}



//POST REQ FROM APP AND POST TO TS
app.post('/send-acvalue', async (req, res) => {

  newdata = req.body;
  // acval = newdata["value"];
  automode = newdata["automode"];
  // actno = newdata["actuator"];


  if (!automode) {

    MotoractnoToint = 0;
    FeederactnoToint = 0;

    switch (newdata["actuator"]) {
      case 1:
        if (newdata["value"] == true) {
          MotoractnoToint = 1;
        } else if (newdata["value"] == false) {
          MotoractnoToint = 0;
        }
        break;

      case 2:
        if (newdata["value"] == true) {
          FeederactnoToint = 1;
        } else if (newdata["value"] == false) {
          FeederactnoToint = 0;
        }
        break;

      default:
        // MotoractnoToint = 0;
        // FeederactnoToint = 0;
        break;
    }

    res.send(`${MotoractnoToint},${FeederactnoToint}`);



    // try {
    //   const apiUrl = `https://api.thingspeak.com/update?api_key=ML5MKGQJLZDPCMDC&field1=${MotoractnoToint}&field2=${FeederactnoToint}`;
    //   const response = await fetch(apiUrl, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' }
    //   });

    //   if (!response.ok) {
    //     throw new Error(`API request failed with status ${response.status}`);
    //   }
    //   res.send(`${MotoractnoToint},${FeederactnoToint}`);

    // }

    // catch (error) {
    //   console.error(error);
    //   res.status(500).send('Error fetching data');
    // }

  }
  else {
    res.status(409).send('automatic');
  }

});



//NOTIFICATION TRIGGER + AUTO ACTUATOR

app.get('/get-noti-actuator', notiTrigger, async (req, res) => {

  let currentTimeMotor = Math.floor(Date.now() / 1000);
  let currentTimeFeeder = Math.floor(Date.now() / 1000);


  if (automode) {


    //console.log("Motor");
    if (currentTimeMotor - previousTimeMotor >= eventIntervalMotor) {
      //console.log("reload done");
      if (ph > 7.5 || ph < 6.5 || temp > 30 || temp < 22) {
        //console.log(`${ph}+${temp}`);
        MotoractnoToint = 1;
        previousTimeMotor = currentTimeMotor;

        previousRunTimeMotor = Math.floor(Date.now() / 1000);

        if (MotoractnoToint == 1) {
          getMessaging().send({
            notification: {
              title: "Motor",
              body: "Activated",
            },
            token: "cfbyG9QYSvizvOzX6nphbG:APA91bGhozCWJkSgOHBBG3utPfwt9jShpQ9UriQAb3tLEkwgzoMOAZC0sjUlSGzR9z3OBG6VKl4z6dvOf-9zY6JDyXxVADEJqULImlAsR3tYDJYDphNEX6OFyEHHShAed9rBJnqagOy8",
          });
        }



      }
      else {
        console.log("entered");
        MotoractnoToint = 0;
  

      }



    }
    else {

      currentRunTimeMotor = Math.floor(Date.now() / 1000);

      console.log("motor event reload not done");
      if (currentRunTimeMotor - previousRunTimeMotor >= RunIntervalMotor) {
        console.log("motor work time done");


        //console.log("value crossed");
        MotoractnoToint = 0;
       


      }
      else {
        console.log("motor work time not done");
      }

    }


    //AUTOFEEDER

    //console.log("Feeder");
    if (currentTimeFeeder - previousTimeFeeder >= eventIntervalFeeder) {
      //console.log("reload done");
      if (ph > 7.5 || ph < 6.5 || temp > 30 || temp < 22) {

        //console.log("value crossed");
        FeederactnoToint = 1;
        previousTimeFeeder = currentTimeFeeder;

        previousRunTimeFeeder = Math.floor(Date.now() / 1000);



        if (FeederactnoToint == 1) {
          getMessaging().send({
            notification: {
              title: "Feeder",
              body: "Activated",
            },
            token: "cfbyG9QYSvizvOzX6nphbG:APA91bGhozCWJkSgOHBBG3utPfwt9jShpQ9UriQAb3tLEkwgzoMOAZC0sjUlSGzR9z3OBG6VKl4z6dvOf-9zY6JDyXxVADEJqULImlAsR3tYDJYDphNEX6OFyEHHShAed9rBJnqagOy8",
          });
        }


      }
      else {
        FeederactnoToint = 0;
  
      }



    }
    else {

      currentRunTimeFeeder = Math.floor(Date.now() / 1000);
      console.log("feeder event reload not done");

      if (currentRunTimeFeeder - previousRunTimeFeeder >= RunIntervalFeeder) {
        //console.log("reload done");
        console.log("feeder work time done");


        //console.log("value crossed");
        FeederactnoToint = 0;



      }
      else {
        console.log("feeder work time not done");
      }
   

    }

    res.send({
      "motor": MotoractnoToint,
      "feeder": FeederactnoToint
    });

    //res.send(rizzponse);

  }
  else {
    res.status(409).send("not automatic");
  }


});

app.get('/activate', (req, res) => {

  res.send("Activated");
});



app.listen(process.env.PORT || 3000, function () {
  console.log(`Server started on port ${process.env.PORT}`);
});




/* 
CLEAN UP:

THINGSPEAK POST CODE INTO SINGLE FUNCTION

GET ENDPT FROM ESP32 TO HERE EVERY SECOND:
  GET DATA FROM HERE FOR ACTUATOR (REMOVE TS FETCH) + RES.SEND(ACT VALUES) WORK
   MILLIS FUNCTION FOR NOTIFCATION

  CHANGE SEVER2 IN ESP32

  ADD APIREQ LINE IN APP
 
*/




