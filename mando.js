var Servient = require("@node-wot/core").Servient;
var MqttClientFactory = require("@node-wot/binding-mqtt").MqttClientFactory;
const express = require('express');
const app = express();

Helpers = require("@node-wot/core").Helpers;

//Creamos el Servient y el protocolo MQTT

let servient = new Servient();
servient.addClientFactory(new MqttClientFactory(null));

//Thing description

let td = `{
    "@context": "https://www.w3.org/2019/wot/td/v1",
    "title": "AireAcondicionado",
    "id": "urn:dev:wot:mqtt:AireAcondicionado",
    "properties": {
        "temperatura": {
            "type": "integer",
            "forms": [{
                "href": "mqtt://test.mosquitto.org:1883/AireAcondicionado/properties/temperatura"
            }]
        }
    },
    "actions" : {
        "OnOff": {
            "forms": [
                {"href": "mqtt://test.mosquitto.org:1883/AireAcondicionado/actions/OnOff"}
            ]
        },
        "incrementar": {
            "forms": [
                {"href": "mqtt://test.mosquitto.org:1883/AireAcondicionado/actions/incrementar"}
            ]
        },
        "decrementar": {
            "forms": [
                {"href": "mqtt://test.mosquitto.org:1883/AireAcondicionado/actions/decrementar"}
            ]
        },
        "leerTemperatura": {
            "forms": [
                {"href": "mqtt://test.mosquitto.org:1883/AireAcondicionado/actions/leerTemperatura"}
            ]
        }
    }, 
    "events": {
        "estadoTemperatura": {
            "type": "integer",
            "forms": [
                {"href": "mqtt://test.mosquitto.org:1883/AireAcondicionado/events/estadoTemperatura"}
            ]
        } 
    } 
}`;

try {
    servient.start().then((WoT) => {
        WoT.consume(JSON.parse(td)).then((thing) => {
            console.info(td);

            

            thing.subscribeEvent(
                "estadoTemperatura",
                (temperatura) => console.info("value:", temperatura),
                (e) => console.error("Error: %s", e),
                () => console.info("Completado")
            )

            console.info("Suscrito");

            app.set('view engine', 'jade');

            app.get("/mando", function (req, res) {
                res.render("mando", {
                    title: "Mando del aire"
                });
            });

            app.get("/subirTemperatura", function (req, res) {
                res.render("mando", {
                    title: "Mando del aire",
                    subirTemperatura: thing.invokeAction('incrementar')
                });
            });

            app.get("/bajarTemperatura", function (req, res) {
                res.render("mando", {
                    title: "Mando del aire",
                    bajarTemperatura: thing.invokeAction('decrementar')
                });
            });

            app.get("/mostrarTemperatura", function (req, res) {
                res.render("mando");
            });

            app.listen(4000);
        });
    });
} catch (err) {
    console.error("Error en el script: ", err);
}