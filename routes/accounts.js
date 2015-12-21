/**
 * Created by artiom on 09/12/15.
 */
module.exports = function(app, connection){

	var express = require("express"),
		mysql = require('mysql'),
		jwt = require("jsonwebtoken"),
		config = require("../config"),
		nodemailer = require("nodemailer");
	/*
	 Here we are configuring our SMTP Server details.
	 STMP is mail server which is responsible for sending and recieving email.
	 */
	var transporter = nodemailer.createTransport({
		service: "Gmail",
		auth: {
			user: "prueba.desarrollo123@gmail.com",
			pass: "P@ssword_Desarrollo"
		}
	});

	var accountsRoutes = express.Router();
	var tokenVerification = express.Router();

	function getToken(req, res, next){
		var token = req.body.token || req.query.token || req.headers['x-access-token'];
		// decode token
		if (token) {
			// verifies secret and checks exp
			jwt.verify(token, config.secret, function(err, decoded) {
				if (err) {
					res.status(403).send({
						success: false,
						message: 'No se ha podido autenticar el token.'
					});
				} else {
					req.decoded = decoded;
					next();
				}
			});

		} else {
			res.status(403).send({
				success: false,
				message: 'No se ha provisto un token.'
			});
		}
	}

	tokenVerification.use(getToken);

	function signUp(req, res){
		var nick = req.body.nick;
		var mail = req.body.mail;
		var password = req.body.password;

		var rand = Math.floor((Math.random() * 100) + 54);
		var query = "INSERT INTO users (nick, mail, password, users.check) VALUES (?, ?, ?, '" + rand + "')";

		connection.query(query, [nick, mail, password], function(err, result){
			if (err){
				console.log(err);
			} else {
				console.log(result.insertId);
				var dataToken = {
					mail: mail,
					id: result.insertId,
					check: rand
				};
				var checkToken = jwt.sign(dataToken, config.secret, {expiresIn: '10 minutes'});

				var link = "http://localhost:3000/verify?checkToken=" + checkToken;
				var mailOptions = {
					to : mail,
					subject : "Favor de verificar tu cuenta de mail",
					html : "Hola,<br> Por favor haz click en el link para verificar tu dirección de correo electrónico.<br><a href="+link+">Click aquí para verificar</a>"
				};
				transporter.sendMail(mailOptions, function(error, response){
					if(error){
						console.log(error);
						res.end("error");
					}else{
						console.log("Message sent: " + response.message);
						res.end("sent");
					}
				});
			}
		});
	}

	function verify(req, res){

		var token = req.query.checkToken;
		// decode token
		if (token) {
			// verifies secret and checks exp
			jwt.verify(token, config.secret, function(err, decoded) {
				if (err) {
					jwt.verify(token, config.secret, {ignoreExpiration: true}, function(err, decoded){
						if (err){
							res.status(403).send({
								success: false,
								message: 'El enlace provisto no es válido.'
							});
						} else {
							var newToken = jwt.sign(decoded, config.secret, {expiresIn: '10 minutes'});
							var link = "http://localhost:3000/verify?checkToken=" + newToken;
							var mailOptions = {
								to : decoded.mail,
								subject : "Favor de verificar tu cuenta de mail",
								html : "Hola,<br> Por favor haz click en el link para verificar tu dirección de correo electrónico.<br><a href="+link+">Click aquí para verificar</a>"
							};
							transporter.sendMail(mailOptions, function(error, response){
								if(error){
									console.log(error);
									res.end("error");
								}else{
									console.log("Message sent: " + response.message);
									res.status(200).send({
										success: true,
										message: 'El enlace provisto ha expirado. Hemos enviado un nuevo mensaje a su casilla de correo para validar su cuenta'
									});
								}
							});
						}
					});
				} else {
					var id = decoded.id;
					var mail = decoded.mail;
					var check = decoded.check;

					var query = "SELECT mail, users.check FROM users WHERE idusers = ?";

					connection.query(query, [id], function(err, rows){
						if (err){
							console.log(err);
							res.status(500).send({
								success: false,
								message: 'No hemos podido validar su cuenta.'
							})
						} else if (rows[0].check == check){
							console.log('mail verificado');

							query = "UPDATE users SET validado = 1 WHERE idusers = ?";

							connection.query(query, [id], function(err, result){
								if (err){
									console.log(err);
								} else {
									res.status(200).send({
										success: true,
										message: 'Su cuenta ha sido verificada exitosamente'
									});
								}
							})
						} else {
							res.status(403).send({
								success: false,
								message: 'No hemos podido validar su cuenta.'
							})
						}
					});
				}
			});
		} else {
			res.status(403).send({
				success: false,
				message: 'El enlace provisto no es válido.'
			});
		}
	}

	function login(req, res){
		var name = req.body.name;
		var password = req.body.password;

		var query = 'SELECT idusers, nick, mail, nombre FROM users INNER JOIN roles ON fk_role = idroles WHERE nick = ? AND password = ?';

		connection.query(query, [name, password], function(err, rows) {
			if (err){
				console.log(err);
				//error handling
			} else if (rows.length == 1){
				var token = jwt.sign(rows[0], config.secret, {expiresIn: "1 day"});
				res.json({
					status: 200,
					token: token
				})
			}
		});
	}

	//un comentario
	function getUserData(req, res){
		console.log(req.decoded);
		res.json({
			status: 200,
			data: req.decoded
		})
	}

	app.use('/api', tokenVerification);

	accountsRoutes.post('/signUp', signUp);
	accountsRoutes.post('/authenticate', login);
	accountsRoutes.get('/api/userData', getUserData);
	accountsRoutes.get('/verify', verify);

	app.use(accountsRoutes);


};