/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var proxyBase = lib_require("db/proxy-base");

var support = {
	type: "mysql",
	modName: "mysql",
	modVersion: "*",
	mod: null,//loaded dynamically
	ops: ["query"]
};

exports.support = support;

exports.createProxy = function(client){
	return new MysqlProxy(client);
}

exports.createPool = function(config){
	var mysql = support.mod;
	config.port = config.port ? config.port : 3306;
	config.host = config.host ? config.host : "localhost";	
	var createFn = 	function (callback) {
		var c = mysql.createConnection(
			{
				host: config.host,
				user: config.user,
				password: config.password,
				database: config.database,
				timezone: config.timezone
			}
		);
		c.connect(function(err) {
			if (err) {
				sh.error('Error connecting to mysql instance: ' + err.stack);
			}
			callback(err, c);
		});
	};

	var destroyFn = function (client) {
			client.end();
	};
	
	return proxyBase.createPool(config, createFn, destroyFn);
}

function MysqlProxy(client){
	return proxyBase.ProxyBase.call(this, client);
}

MysqlProxy.prototype = Object.create(proxyBase.ProxyBase.prototype);

MysqlProxy.prototype.startTransaction = function(callback){
    return this.client.query("START TRANSACTION", callback);	
}

MysqlProxy.prototype.commit = function(callback){
    return this.client.query("COMMIT", callback);	
}

MysqlProxy.prototype.rollback = function(callback){
    return this.client.query("ROLLBACK", callback);	
}