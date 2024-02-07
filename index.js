import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getMessaging } from "firebase-admin/messaging";
import express, { json, response } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

var newdata;
var ph = 4
var temp = 26;
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


// initializeApp({
//   credential: applicationDefault(),
//   projectId: 'aquanex-cbd72',
// });


// initializeApp({
//      credential: admin.credential.cert({
//        projectId: "aquanex-cbd72",
//        clientEmail: "firebase-adminsdk-6xeg6@aquanex-cbd72.iam.gserviceaccount.com",
//        privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCqrTaMglyRv0vc\nC+qtIDiS3R9KR4yiuAz7kV6UFv1hUc18uWJFDpI3si0p3D5gsiN6S9DCpPlz7zqi\nbj32HEVerl0KCzuxTbtcipns6vhF7bdXcRLVMWc6U/tf/KTCOSSwDX3kTxqaZuTL\nST9+GCPDflaIoV7XSwAxIxwCWrbK25Mj+iZU5tNsLIAZlsnpZjTZ8z1MEkOF5FTs\nkGcGJ7rLHyE31xNTISmArQV2DwRghP+arIl9m9Socma3fkz//e4oqxEOdMyq6JEY\nj1ZheAex7L9uKkVp0xM0lTxAEfG6ulj0dVpexpkdqqvIJptePxgkxdhAuZ+uoQpS\nsgl+0JbzAgMBAAECggEAAmSM13C7kjao2awcz6RlWzgGP1j8KGZpuwoBVfAESYJZ\nuVvXIMdulqEpfVvRmOmWbZlsEwjKoaOsK2jwG0yK4UiS78Xlivu6yFrZXyltkzKK\nwNRKNPGolC8eOkhXYrFlrjQsgQKKm92u/eN17XxpS1+MIE70kMlodn6/cP3dlORP\ncgGhcfoV6rasc/lqAdwAr0GNEQhCZ1lseajV8DhgbW5B9cekqsobxqqeMKKapXwD\nD6gmIZgBz5R++f3k1SW0NdNIcXKw5l0X04Wj1riV25wiB12Emcfz8tpkNmyA3mAW\nTg2Kv+6Tjs+GrlRn9JT1cqOK8SjoaUIMHnHFpXWsYQKBgQDRDga447ygVfXMadx0\nd1Kduw4hQ/E+M/ZuIoFYygl/SZqvM/6mgu2AeB8YdsiGWKfnJI6+npB7yaHZ3yGw\nB7ZB3RxC0esn6/UJwJLnCHgSZqX6RD7K1+eUe3/eP1EiN0OInOSQggmA4hBjSKGI\n0BpKoNoBvshgvdrO2PpaBar6YQKBgQDRAO7dEAOtzI0HxWsWxwkcDdAkcm8711xj\nCNKlQYDdmh/Z35MzWty1u+GnY483LLfJUtni002q3MdcDHtFfSfelFdsSzpRCuZC\nxNwSvgszZMsetBtLABpCsVioWUbon7eqCAo0yIbdS2bCVrx1xTJjOyl4z+F7y2jt\nEE6OtajZ0wKBgFGFOrHWfLO5UYRIs6Lm9Nx1GOl36RbshGgmJHJPNqzgMuWnTOH5\npEu4i8eqaj+ZSsAjzVYf1w+ubOLc0/Ikz7mXU3HrEdwbcw4+fgqBjvD9/jM9cY7/\n6lpIXnB4GFdTXY5kP+zqCHKttN5CcFs9a0M2vkx37QNshWqrydRY6XeBAoGARS/4\n4sdNYHhpa1woEjc7RcUw1Q/o0Ld/Ru2BxeEERtehmZ9QfFyk2ahjj+T+YPZ1tLiv\nlk361QgXGtqq6BsBWsZill/k4zUneozuiWnODWpdb0GSE2bqSo+o2LoNJi7RPwFA\nV67WLmWqk8TgyF/KSV0pYmv2qeNxTaDrUITEa68CgYBaCPoeDCHFPs8C9fQiAUdS\nXgLZtIBe/QuKFN0YHE4kDv60e9Br41Ecm7WbE8AXZOM3pqPis8Q2UzTCS1saUK8O\nr0bGPzbUFrCN4jnKQxt79npYNbSgEk9hytR+5Ceoec8dFGA9yspXisi4D+nDenpI\ntr1HLVjV+ztSz4lUVneBXQ==\n-----END PRIVATE KEY-----\n"
//      }),
     
//    });


initializeApp({
  credential: cert({
    projectId: process.env.CYCLIC_PROJECT_ID,
    clientEmail: process.env.CYCLIC_CLIENT_EMAIL,
    privateKey: process.env.CYCLIC_PRIVATE_KEY
  }),
  
  
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
