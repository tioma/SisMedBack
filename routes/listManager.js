/**
 * Created by artiom on 28/01/16.
 */

module.exports = function(app, redisConnection){

    var express = require("express");

    var listManager = express.Router();

    function registrarCaja(req, res){
        //Ver approach sobre info que debería enviar la caja

    }

    function hacerCola(req, res){
        //Ver info que debería mandar la app
        var cola = "miCola1";
        var cliente = "unCliente";
        redisConnection.lpush([cola, cliente], function(err, reply){
            console.log(reply);
        })
    }

    listManager.post("/hacerCola", hacerCola);

    app.use(listManager);

};
