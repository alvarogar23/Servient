var Servient = require('@node-wot/core').Servient;
var MqttBrokerServer = require('@node-wot/binding-mqtt').MqttBrokerServer;
const http = require('http');
const express = require('express');
const app = express();

//Creamos el servient y el protocolo MQTT

let servient = new Servient();
servient.addServer(new MqttBrokerServer('mqtt://test.mosquitto.org'));

servient.start().then((WoT) => {

    var temperatura;
    var alarma;

    WoT.produce({
        title: 'AireAcondicionado',
        description: 'Aparato de aire acondicionado que muestra la temperatura',
        '@context': [
            'https://www.w3.org/2019/wot/td/v1',
        ],
        properties: {
            temperatura: {
                type: 'integer',
                description: 'valor actual de la temperatura'
            },
            alarma: {
                type: 'boolean',
                description: 'Estado de la alarma'
            }
        },
        actions: {
            OnOff: {
                description: 'Apaga o enciende el aire'
            },
            incrementar: {
                description: 'Sube la temperatura'
            },
            decrementar: {
                description: 'Baja la temperatura'
            },
            alarma: {
                description: 'Activa o desactiva la alarma'
            }
        },
        events: {
            mostrarTemperatura: {
                description: 'Muestra la temperatura actual'
            },
            estadoAlarma: {
                description: 'Estado de la alarma'
            }
        }



    }).then((thing) => {
        console.log('Producido ' + thing.getThingDescription().title);

        //inicializamos los valores de las propiedades
        temperatura = 10;
        alarma = false;

        //Manejadores de las propiedades
        thing.setPropertyReadHandler('temperatura', async () => temperatura);
        thing.setPropertyReadHandler('alarma', async () => alarma);

        thing.setActionHandler('incrementar', () => {
            console.log('Subiendo temperatura');
            temperatura++;
        });

        thing.setActionHandler('decrementar', () => {
            console.log('Bajando temperatura');
            temperatura--;
        });

        thing.setActionHandler('alarma', async () => {
            let tempTemperatura = await thing.readProperty('temperatura');
            if (tempTemperatura > 12) {
                console.log('La temperatura es muy alta');
                //thing.invokeAction('decrementar');
                alarma = true;
                
            }

        })


        thing.expose().then(() => {
            console.info(thing.getThingDescription().title + 'ready');

            setInterval(() => {
                thing.emitEvent('mostrarTemperatura', temperatura);
                console.info('Temperatura', temperatura);
            }, 1000);

            setInterval(() => {
                thing.emitEvent('estadoAlarma', alarma);
                console.info('Estado de la alarma', alarma);
            }, 1000);

        });

        const funcion1 = module.exports = function(){
            return 'hola';
        };

        const config = {
            pug:{
                locals: {
                    funcion1,
                },
            },
        };


        //Plasmamos los datos en web

        app.set('view engine', 'jade');

        app.get('/', function (req, res) {
            res.render('air', { title: 'Aparato de aire', temperature: temperatura});
        });

        

        

        app.listen(3000);





    }).catch((e) => {
        console.log(e);
    });

});



