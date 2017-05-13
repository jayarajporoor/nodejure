/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var genericPool = require('generic-pool');

exports.createPool = function(config, createFn, destroyFn){
	var pool = genericPool.Pool({
		name: config.name,
		create: createFn,
		destroy: destroyFn,
		max: config.maxConnections ? config.maxConnections : 50,
		min: config.minConnections ? config.minConnections : 2,
		idleTimeoutMillis: config.idleTimeoutMillis ? config.idleTimeoutMillis : 30000,
		log: config.log
	});
	return pool;
}

function ProxyBase(client){
	this.client = client;
}

ProxyBase.prototype.setClient = function(client){
	this.client = client;
}

ProxyBase.prototype.getClient = function(){
	return this.client;
}

ProxyBase.prototype.genericQuery = function(name, params, callback){
	params.push(callback);
	return this.client[name].apply(this.client, params);
}

exports.ProxyBase = ProxyBase;

