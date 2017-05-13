/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
var WebSocket = require('ws');
var domain = require('domain');
var os = require("os");
var ws;
var activeConn = false;
var nextReqId = 1;
var pendingResponses = {};
var pendingRequests = [];

module.exports = function(){
	return extInfo;
} 

var extInfo = 
{
	hooks:[{type: "init", name: "ccs", handler: ccsInit, 
	priority: sh.hookPriorities.late}],
	services:{
		ccs:{
			routines:{}
		}
	}
};


function ccsInit(done){
	if(!sh.appCtx.config.ccs.enable){
		done();
		return;
	}
	var d = require('domain').create();
	d.add(sh);
	d.on('error', function(er) {
		activeConn = false;
		sh.error("Websocket error: " + er.stack);
		setTimeout(wsOpen, sh.serverCtx.appCtx.config.ccs.retryMillis);
	});
	d.run(wsOpen);
	sh.ccs = {};
	var config = sh.appCtx.config;	
	createStubs(config.ccs.services);	
	done();
}

function wsOpen(){
	var config = sh.serverCtx.appCtx.config;
	var ccsUrl = "ws://" + config.ccs.host + ":" + config.ccs.port;
	sh.info("Attempting to open CCS connection to " + ccsUrl);
	ws = new WebSocket(ccsUrl);
	wsEvents();
}

function wsEvents(){
	ws.on('open', function open() {
		activeConn = true;
		sh.info("CCS connection opened");
		for(var i=0;i<pendingRequests.length;i++){
			var req = pendingRequests[i];
			var json = JSON.stringify(req);
			sh.info("CCS - sending queued request: " + req.header.reqid 
			                + " to service: " + req.header.service);
			ws.send(json);
		}
		pendingRequests = [];
	});

	ws.on('message', function(data, flags) {
	  // flags.binary will be set if a binary data is received.
	  // flags.masked will be set if the data was masked.
	  //console.log("WS message: " + data);
	  var res = JSON.parse(data);
	  sh.info("CCS response for request: " + res.header.reqid);	  
	  var ctx = pendingResponses[res.header.reqid];
	  if(ctx){
		if(ctx.callback){
			ctx.callback(res.header.err, res.body);
		}
		delete pendingResponses[res.header.reqid];
	  }else{
		sh.error("No pending response entry found for: " + req.header);
	  }
	});			
}

function createStubs(services){
	for(var i=0;i< services.length;i++){
		var svc = services[i];
		sh.services.ccs.routines[svc] = invokeService.bind(null, svc);
	}
}

function invokeService(svc){
	var reqid = nextReqId;
	nextReqId++;
	var req = {header: {reqid: reqid, service: svc}}
	var params = Array.prototype.slice.call(arguments, 1);
	var callback = params.pop();
	req.params = params;
	pendingResponses[reqid] = {callback: callback, req: req};
	if(activeConn){		
		var json = JSON.stringify(req);
		sh.info("CCS - sending request: " + reqid + " to service: " + svc);
		ws.send(json);
	}else{
		sh.info("CCS - queuing request: " + reqid + " to service: " + svc);	
		pendingRequests.push(req);
	}
}

