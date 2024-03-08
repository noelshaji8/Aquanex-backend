import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getMessaging } from "firebase-admin/messaging";
import express, { json, response } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";


const app = express();


var heartrate;
var temp;




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

//THIS INITIALIZEAPP IS DIFFERERNT FOR URS

initializeApp({
  credential: cert({
    projectId: process.env.CYCLIC_PROJECT_ID,
    clientEmail: process.env.CYCLIC_CLIENT_EMAIL,
    //privateKey: process.env.CYCLIC_PRIVATE_KEY
    privateKey: privateKey,
  }),

});


app.get('/get-notification', async (req, res) => {

    
    try {

        // CODE FOR GETTING VALUES FROM UR FIREBASE REALTIME FIREBASE
        //STORE THE VALUES INTO HEARTRATE AND TEMP
       
  
        if (heartrate > 7.5 || heartrate < 6.5) {
  
          await getMessaging().send({
            notification: {
              title: "Heartrate",
              body: "Threshold crossed",
            },
            token: "YOUR FCM TOKEN",
          })
  
        }
  
        if (temp > 30 || temp < 22) {
  
          await getMessaging().send({
            notification: {
              title: "Temperature",
              body: "Threshold crossed",
            },
            token: "YOUR FCM TOKEN",
          })
        }
  
  
  
      }
  
      catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
      }
  
});