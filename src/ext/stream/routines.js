/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
var util = require("util");

exports.prev = function(data, field, resField, cb, srcCache){
	var predata = srcCache.preData;
	var preindex = srcCache.preIndex;
	if(!util.isArray(data)){
		var preValue = predata[field];
		if(preValue){
			data[resField] = preValue;
		}else{
			data[resField] = data[field];
		}
		cb(null, data);
		return;
	}
	//is array
	if(!predata){
		for(var i=0;i<data.length;i++){
			data[i][resField] = data[i][field];
		}
		cb(null, data);
		return;
	}
	if(preindex){
		for(var i=0;i<data.length;i++){
			var keyValue = data[i][preindex.key];
			var j = preindex.map[keyValue];
			if(j && (j < predata.length)){
				var preValue = predata[j][field];
				data[i][resField] = preValue;
			}else{
				data[i][resField] = data[i][field];
			}
		}
	}else{
		for(var i=0;i<data.length && i < predata.length;i++){
			var preValue = predata[i][field];
			if(preValue){
				data[i][resField] = preValue;
			}else{
				data[i][resField] = data[i][field];
			}
		}
	}
	cb(null, data);
} 

exports.diff = function(data, fieldA, fieldB, resField, cb){
	if(!util.isArray(data)){
		data[resField] = data[fieldA] - data[fieldB];
		cb(null, data);
		return;
	}
	for(var i=0;i<data.length;i++){
		data[i][resField] = data[i][fieldA] - data[i][fieldB];
	}
	cb(null, data);
} 

exports.sum = function(data, fieldA, fieldB, resField, cb){
	if(!util.isArray(data)){
		data[resField] = data[fieldA] + data[fieldB];
		cb(null, data);
		return;
	}
	for(var i=0;i<data.length;i++){
		data[i][resField] = data[i][fieldA] + data[i][fieldB];
	}
	cb(null, data);
} 

exports.contains = function(data, str, fields, resField, cb){
	str = str.toLowerCase();
	fields = fields.toLowerCase();
	var f = fields.split(",");
	var r = false;
	for(var i=0;i<f.length;i++){
		if(str.indexOf(f[i]) >= 0){
			r = true;
			break;
		}
	}
	data[resField]  = r;
	cb(null, data);
}  

var fetchCache = {};
var fetchList = [];
var url = require('url');
var https = require('https');
var http = require('http');
exports.fetch = function(data, url0, resField, cb){
	var cached = fetchCache[url0];
	if(cached){
		data[resField] = cached;
		cb(null, data);
		return;
	}
	var user, pass;
	var cacheSize = 1000;
	var fetchConfig = sh.appCtx.config.services.fetch;
	if(fetchConfig){
		user = fetchConfig.user;
		pass = fetchConfig.pass;
		if(fetchConfig.cacheSize){
			cacheSize = fetchConfig.cacheSize;
		}
	}
	var u = url.parse(url0);
	var engine = http;
	if(u.protocol.startsWith("https")){
		engine = https;
	}
	
	var reqParams = 
	{
		hostname: u.hostname,
		port: u.port, 
		path: u.path, 
		method: 'GET',
		headers:{
			"User-Agent" : "Shelloid/1.0"
		}
	};
	if(user && pass){
		reqParams.auth = user + ":" + pass;
	}
	engine.get(reqParams,
		function(response){
		  var str = "";
		  response.on('data', function (chunk) {
			str += chunk;
		  });

		  response.on('end', function () {	  			
			var json = null;
			try{
				json = JSON.parse(str);			
				fetchCache[url0] = json;
				fetchList.unshift(url0);
				if(fetchList.length > cacheSize){
					var evicted = fetchList.pop();
					delete fetchCache[evicted];
				}
				data[resField] = json;
				cb(null, data);
			}catch(e){
				cb("Error parsing JSON response: " + str,
					null);
			}		
		}
	);
	
}