/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
var http= require("http"); 
var moment = require('moment-timezone');

exports.info = {
	scopes: ["instance", "def"],
	auth: "none"
}

exports.init = function(done){
	done();
}

exports.create = function(scopeObj, srcId, transportDesc, callback){
	//scopeObj is either streamDef or streamInstance
	var url = 
	"http://207.251.86.229/nyc-links-cams/LinkSpeedQuery.txt";
	callback(null, new NycTransport(url, scopeObj, transportDesc));
}

function NycTransport(url, scopeObj, transportDesc){
	this.url = url;
	this.scopeObj = scopeObj;
	this.staleThresholdMillis = 3*60*1000;//3 mins
	if(transportDesc && transportDesc.staleThresholdMillis){
		this.staleThresholdMillis = 
				transportDesc.staleThresholdMillis;
	}
}
 
NycTransport.prototype.onData = function(callback){
	this.callback = callback;
	var transport = this;

	var doSample = function(){
		var waitTime = 0;
		var currTs = (new Date()).getTime();
		if(transport.sampleStart){
			waitTime = currTs - transport.sampleStart;
			waitTime = 	transport.scopeObj.psdl.sample - waitTime;
		}
		if(waitTime > 0){
			setTimeout(doSample, waitTime);
		}else
		{			
			transport.sampleStart = currTs;
			http.get(transport.url, processResponse);
		}
	}

	var processResponse = function(response) {
	  var str = '';

	  response.on('data', function (chunk) {
		str += chunk;
	  });

	  response.on('end', function () {
		var json = parseResponse(str, transport);
		var rec = {$data : {linkspeed: json}, 
					$meta : {linkspeed: {unique: "linkName"} }
				  };
		callback(null, rec);
		doSample();
	  });
	}
	
	doSample();
}

function formatNYCDate(d){
	var f = "";
	var day, month, year;
	for(var i=0;i<d.length;i++){
		if(d[i] === "/"){
			if(!month){
				month = f;
			}else
			if(!day){
				day = f;
			}
			f = "";
		}else
		if(d[i] === " "){
			year = f;
			f = "";
		}else{
			f = f + d[i];
		}
	}
	
	if(month.length === 1){
		month = "0" + month;
	}
	var t = year + "-" + month + "-" + day + " " + f;
	return t;
}

function parseResponse(str, transport){
	var res = [];
	var lines = str.split("\n");
	for(var i=1;i<lines.length;i++){
		var fields = lines[i].split("\t");
		for(var j=0;j<fields.length;j++){
			fields[j] = fields[j].trim()
						.replace('"', '').replace('"', '');
		}
		if(fields.length >= 13){
			var dataAsOf = fields[4];
			var ts = formatNYCDate(fields[4]);
			var tsM = moment.tz(ts, "America/New_York");
			var now = moment();
			var elapsedMillis = now.valueOf() - tsM.valueOf();
			if(elapsedMillis <= 
						transport.staleThresholdMillis){
				var rec = {
					Speed: parseFloat(fields[1]), 
					TravelTime: parseFloat(fields[2]),
					DataAsOf: dataAsOf, 
					Borough: fields[11],
					linkName: fields[12]
				};
				res.push(rec);
			}
		}
	}
	return res;
}
 