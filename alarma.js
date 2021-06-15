var Servient = require('@node-wot/core').Servient;
var MqttClientFactory = require('@node-wot/binding-mqtt').MqttClientFactory;

Helpers = require('@node-wot/core').Helpers;

//Creamos el Servient y el protocolo MQTT

let servient = new Servient();
servient.addClientFactory(new MqttClientFactory(null));

//Thing description

let td = `{
    "@context": "https://www.w3.org/2019/wot/td/v1",
    "title": "AireAcondicionado",
    "id": "urn:dev:wot:mqtt:AireAcondicionado",
    "properties": {
        "temperatura" : {
            "type": "integer",
            "forms": [{"href": "mqtt://test.mosquitto.org:1883/AireAcondicionado/properties/temperatura"}]
        }
    },
    "actions" : {
        "alarma": {
            "forms": [
                {"href": "mqtt://test.mosquitto.org:1883/AireAcondicionado/actions/alarma"}
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



            thing.subscribeEvent('estadoTemperatura',
                x => console.info('Temperatura: ', x),
                e => console.error('Error: %s', e),
                () => console.info("Completado")
            );

            console.info('Suscrito');


            setInterval(async () => {
                thing.invokeAction('alarma')
                    .then((res) => {})
                    .catch((err) => {
                        console.error('Error en la acción de alarma', err.message);
                    });



                console.info('Activa la alarma!!!!');
            }, 1000);









        });
    });
} catch (err) {
    console.error('Error en el script: ', err);
}