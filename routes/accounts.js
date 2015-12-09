/**
 * Created by artiom on 09/12/15.
 */
module.exports = function(app, connection){

	var express = require("express"),
		mysql = require('mysql');

	var accountsRoutes = express.Router();

	function login(req, res){
		var name = req.body.name;
		var password = req.body.password;

		console.log(name);
		console.log(password);

		var query = 'SELECT secret FROM users INNER JOIN roles ON fk_role = idroles WHERE nick = ? AND password = ?';

		connection.query(query, [name, password], function(err, rows) {
			console.log(rows);
			res.json({
				data: rows
			})
		});
	}

	accountsRoutes.post('/authenticate', login);

	app.use(accountsRoutes);
};