require('dotenv').config();
var Servient = require('@node-wot/core').Servient;
var MqttBrokerServer = require('@node-wot/binding-mqtt').MqttBrokerServer;
const http = require('http');
const express = require('express');
const app = express();
var bodyParser = require('body-parser');

//Creamos el servient y el protocolo MQTT

let servient = new Servient();
servient.addServer(new MqttBrokerServer('mqtt://test.mosquitto.org'));

servient.start().then((WoT) => {

    var temperatura;
    var alarma;
    var alarmaState;
    var modoAutomatico;

    WoT.produce({
        title: 'AireAcondicionado',
        description: 'Aparato de aire acondicionado que muestra la temperatura',
        '@context': [
            'https://www.w3.org/2019/wot/td/v1',
        ],
        properties: {
            temperatura: {
                type: 'integer',
                observable: true,
                description: 'valor actual de la temperatura'
            },
            alarma: {
                type: 'boolean',
                description: 'Estado de la alarma'
            },
            modoAutomatico: {
                type: 'boolean',
                description: 'Si su valor es true la alarma esta activa, en caso contrario estará inactiva'
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
            },
            leerTemperatura: {
                description: 'Lee la temeperatura actual'
            }
        },
        events: {
            estadoTemperatura: {
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
        alarmaState = 'inactiva';
        modoAutomatico = false;

        //Manejadores de las propiedades
        thing.setPropertyReadHandler('temperatura', async () => temperatura);
        thing.setPropertyReadHandler('alarma', async () => alarma);
        thing.setPropertyReadHandler('modoAutomatico', async () => modoAutomatico);

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
                alarmaState = (alarma == false ? 'inactiva':'activa');
                
                
            }else if (tempTemperatura < 5) {
                console.log('La temperatura es muy baja');
                //thing.invokeAction('incrementar');
                alarma = true;
                alarmaState = (alarma == false ? 'inactiva':'activa');
                
            }else{
                alarma = false;
                alarmaState = (alarma == false ? 'inactiva':'activa');
            }

            

        });

        //thing.setActionHandler('activarAlar')

        thing.setActionHandler('leerTemperatura', async () => {
            let tempTemperatura = ''+await thing.readProperty('temperatura');
            
        });

        app.get("/modo", function (req, res) {
            res.render("modo");
            if(req.query.modoAutomatico == 'true'){
                modoAutomatico = true;
                setInterval(async () => {
                    thing.invokeAction('incrementar')
                        .then((res) => {})
                        .catch((err) => {
                            console.error('Error en la acción de incrementar', err.message);
                        });
                }, 1000);

                setInterval(() => {
                    thing.emitEvent('estadoTemperatura', temperatura);
                    console.info('Temperatura', temperatura);
                }, 1000);

            }else{
                modoAutomatico = false;
                thing.expose().then(() => {
                    console.info(thing.getThingDescription().title + 'ready');
        
                    setInterval(() => {
                        thing.emitEvent('estadoTemperatura', temperatura);
                        console.info('Temperatura', temperatura);
                    }, 1000);
        
                    setInterval(() => {
                        thing.emitEvent('estadoAlarma', modoAutomatico);
                        console.info('Estado de la alarma', modoAutomatico);
                    }, 1000);
        
                });

            }
            /*thing.writeProperty('modoAutomatico', modoAutomatico);
            thing.readProperty('modoAutomatico').then(val => console.log(val));*/
            
        });
        
        /*if (modo == true){
            setInterval(async () => {
                thing.invokeAction('incrementar')
                    .then((res) => {})
                    .catch((err) => {
                        console.error('Error en la acción de incrementar', err.message);
                    });
            }, 1000);

            setInterval(async () => {
                thing.invokeAction('alarma')
                    .then((res) => {})
                    .catch((err) => {
                        console.error('Error en la acción de incrementar', err.message);
                    });
            }, 1000);

            setInterval(() => {
                thing.emitEvent('estadoTemperatura', temperatura);
                console.info('Temperatura', temperatura);
            }, 1000);
        }else{*/

        

        //Plasmamos los datos en web

        app.set('view engine', 'jade');
        app.unsubscribe(express.json());
        app.use(express.urlencoded());


        app.get('/', function (req, res) {
            res.render('air', { title: 'Aparato de aire', temperature: temperatura});
        });
  
        app.listen(3000);

        app.get("/alarma", function (req, res) {
            res.render("alarma", {title: 'Alarma',
                estadoAlarma: alarmaState
    
            });
        });

        

        app.listen(5000);

        //}

        

        





    }).catch((e) => {
        console.log(e);
    });

});



