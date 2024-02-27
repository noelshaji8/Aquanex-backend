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
var acval = false;
var automode = true;
var actno = 1;
var MotoractnoToint = 0;
var FeederactnoToint = 0;
var previousTimeMotor = 0;
var eventIntervalMotor = 60;
var previousTimeFeeder = 0;
var eventIntervalFeeder = 60;
var data;


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

  try {
    const apiUrl = "https://api.thingspeak.com/channels/2336234/feeds.json?api_key=ED1802UZPY1V5E5J&results=1";
    let response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    data = await response.json();

    temp = data["feeds"][0]["field1"];
    ph = data["feeds"][0]["field2"];

    if (ph > 5 || ph < 0) {

      await getMessaging().send({
        notification: {
          title: "pH",
          body: "Threshold crossed",
        },
        token: "cfbyG9QYSvizvOzX6nphbG:APA91bGhozCWJkSgOHBBG3utPfwt9jShpQ9UriQAb3tLEkwgzoMOAZC0sjUlSGzR9z3OBG6VKl4z6dvOf-9zY6JDyXxVADEJqULImlAsR3tYDJYDphNEX6OFyEHHShAed9rBJnqagOy8",
      })

    }

    if (temp > 24 || temp < 22) {

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



    try {
      const apiUrl = `https://api.thingspeak.com/update?api_key=ML5MKGQJLZDPCMDC&field1=${MotoractnoToint}&field2=${FeederactnoToint}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      res.send(`${MotoractnoToint},${FeederactnoToint}`);

    }

    catch (error) {
      console.error(error);
      res.status(500).send('Error fetching data');
    }
  }
  else {
    res.status(409).send('automatic');
  }

});



//NOTIFICATION TRIGGER + AUTO ACTUATOR

app.get('/get-noti', notiTrigger, async (req, res) => {


  let currentTimeMotor = Math.floor(Date.now() / 1000);
  let currentTimeFeeder = Math.floor(Date.now() / 1000);
  var rizzponse = "Hi";

  if (automode) {


    rizzponse = rizzponse + "\nauto";

    //console.log("Motor");
    if (currentTimeMotor - previousTimeMotor >= eventIntervalMotor) {
      //console.log("reload done");
      if (ph > 5 || ph < 0 || temp > 27 || temp < 22) {
        //console.log("value crossed");
        MotoractnoToint = 1;
        previousTimeMotor = currentTimeMotor;

        try {
          const apiUrl = `https://api.thingspeak.com/update?api_key=ML5MKGQJLZDPCMDC&field1=${MotoractnoToint}&field2=${FeederactnoToint}`;
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }

        }

        catch (error) {
          console.error(error);
          res.status(500).send('Error fetching data');
        }



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
        MotoractnoToint = 0;
        try {
          const apiUrl = `https://api.thingspeak.com/update?api_key=ML5MKGQJLZDPCMDC&field1=${MotoractnoToint}&field2=${FeederactnoToint}`;
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }

        }

        catch (error) {
          console.error(error);
          res.status(500).send('Error fetching data');
        }

      }

      rizzponse = rizzponse + `\n${MotoractnoToint}`;

    }
    else {
      MotoractnoToint = 0;
      try {
        const apiUrl = `https://api.thingspeak.com/update?api_key=ML5MKGQJLZDPCMDC&field1=${MotoractnoToint}&field2=${FeederactnoToint}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

      }

      catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
      }

      rizzponse = rizzponse + "\nmotor reload Not Done";
    }


    //AUTOFEEDER

    //console.log("Feeder");
    if (currentTimeFeeder - previousTimeFeeder >= eventIntervalFeeder) {
      //console.log("reload done");
      if (ph > 5 || ph < 0 || temp > 27 || temp < 22) {

        //console.log("value crossed");
        FeederactnoToint = 1;
        previousTimeFeeder = currentTimeFeeder;


        try {
          const apiUrl = `https://api.thingspeak.com/update?api_key=ML5MKGQJLZDPCMDC&field1=${MotoractnoToint}&field2=${FeederactnoToint}`;
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }

        }

        catch (error) {
          console.error(error);
          res.status(500).send('Error fetching data');
        }


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
        try {
          const apiUrl = `https://api.thingspeak.com/update?api_key=ML5MKGQJLZDPCMDC&field1=${MotoractnoToint}&field2=${FeederactnoToint}`;
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }

        }

        catch (error) {
          console.error(error);
          res.status(500).send('Error fetching data');
        }
      }

      rizzponse = rizzponse + `\n${FeederactnoToint}`;

    }
    else {
      FeederactnoToint = 0;
      try {
        const apiUrl = `https://api.thingspeak.com/update?api_key=ML5MKGQJLZDPCMDC&field1=${MotoractnoToint}&field2=${FeederactnoToint}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

      }

      catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
      }
      rizzponse = rizzponse + "\nfeeder reload Not Done";
    }

    res.send(rizzponse);

  }
  else {
    res.status(409).send("not automatic");
  }


});

app.get('/activate', (req, res) => {

  res.send("Activated");
});



app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});




/* 
CLEAN UP:

THINGSPEAK POST CODE INTO SINGLE FUNCTION

*/