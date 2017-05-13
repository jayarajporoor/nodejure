/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
var domain = require('domain');
var path = require("path");
var utils = lib_require("utils");
var http = require('http');
var ServerResponse = http.ServerResponse;

exports.addAll = function(appCtx){
	var routes = appCtx.routes;
	var i;
	for(i=0;i < routes.length; i++){
		var ok = addRoute(appCtx, routes[i]);
		if(!ok){
			appCtx.hasErrors(true);
		}
	}
	return i;
}

exports.add = addRoute;
sh.services.route = {
	add: addRoute
};

function addRoute(appCtx, route){
	var app = appCtx.app;
	var urlPath = route.url;
	
	if(route.annotations.ignore){
		return true;
	}
	
	if(!utils.isFunction(route.fn)){
		sh.error("route.fn is not a function for: " + route.url);
		return false;
	}
	
	if(route.annotations["path"]){
		urlPath = route.annotations["path"];
	}else if(route.annotations["pathSuffix"]){
		var pathSuffix = route.annotations["pathSuffix"];
		if(pathSuffix.startsWith("/")){
			urlPath = urlPath + pathSuffix;
		}else{
			urlPath = urlPath + "/" + pathSuffix;
		}
	}
	var method = ["all"];
	
	if(route.annotations["websocket"]){
		app.ws(urlPath, wsRouteWrapper(route, appCtx));
		return true;
	}
	
	if(route.annotations["method"]){
		method = route.annotations["method"];
	}
	
	if(!utils.isArray(method)){
		method = [method];
	}
	
	for(var i=0;i<method.length;i++){

		var fn = routeWrapper(route, appCtx);
		
		var routeInstaller = app[method[i]];
		
		if(routeInstaller){	
			routeInstaller.call(app, urlPath, fn);
			console.log("Mounting " + route.relPath + 
						" (" + route.fnName + ") at " + urlPath + " (" + method[i] + "). ");
		}else{
			sh.error("Cannot mount (unknown method): " + route.relPath + 
						" (" + route.fnName + ") at " + urlPath + " (" + method[i] + "). ");
			appCtx.hasErrors(true);
		}					
	}
	
	return true;
}

function wsRouteWrapper(route, appCtx){
	var handler = 
		function(ws, req){
			req.route = route;
			var res = new ServerResponse(ws.upgradeReq);
			res.status = function (statusCode) {
				if (statusCode > 200) ws.close();
				return res;
			};
			res.end = res.send = function(){};
			ws.res = res;
			var invokeRoute = function(proceed){
				if(!proceed){
					sh.error("Websocket pre-route processing failed: " + req.url);
				}else{
					route.fn(ws, req, sh.routeCtx);			
				}
			}			
			startReqPipeline(req, res, invokeRoute);
		};
	return handler;
}

function routeWrapper(route, appCtx){		
	return function(req, res, next){
		req.route = route;
		try{
			routeHandler(req, res, next);
		}catch(err){
			sh.error("Error processing request for: " + req.url);
			console.log(err.stack);
			res.status(500).end("Internal Server Error");
		}
	}
}
	
function routeHandler(req, res, next){
	var route = req.route;
	var appCtx = sh.appCtx;
	var domainConfig = appCtx.config.hosts[req.headers.host];	
	var doXmit = function(proceed){
		if(!proceed){
			sh.error("Postroute processing failed for: " + route.relPath + " (" + route.fnName + ")");
			logErrors(req);
			return;
		}

		if(res.sh.pendingOp.op == "json"){
			res.json_.apply(res, res.sh.pendingOp.params);
		}else
		if(res.sh.pendingOp.op == "render"){
			res.render_.apply(res, res.sh.pendingOp.params);
		}else{
			throw new Error("Unknown operation in doXmit(): " + res.sh.pendingOp);
		}				
	}
	var invokeRoute = function(){
		res.json_ = res.json;
		res.render_ = res.render;
		res.json = function(obj){
			res.sh.pendingOp = {op: "json", params: [obj]};
			res.sh.obj = obj;
			invokeHooks("postroute", req, res, doXmit);
			return res;
		};			

		res.render = function(view, localsOrCallback, callback){
			res.sh.theme = appCtx.config.theme;

			if(utils.isObject(localsOrCallback)){
				res.sh.obj = localsOrCallback;
			}
		
			var prerenderDone = function(){
				var dirs = appCtx.config.dirs;
				var theme = res.sh.theme;
				var themedViews = dirs.themedViews;				
				if(theme != appCtx.config.theme){
					themedViews = path.resolve(appCtx.config.dirs.views, "themes", theme);
				}
				if(themedViews && themedViews !== ""){
					var viewFile = path.join(themedViews, view);
					var ext = path.extname(viewFile);
					if(ext == ""){
						viewFile = viewFile + "." + appCtx.config.viewEngine;
					}
					if(utils.fileExists(viewFile)){
						view = "themes/" + theme + "/" + view;
					}
				}				
				res.sh.pendingOp = 
					{op: "render", params: [view, localsOrCallback, callback]};			
				invokeHooks("postroute", req, res, doXmit);
			}

			invokeHooks("prerender", req, res, prerenderDone);
			
			return res;
		}
		req.sh.errors = [];//clear any errors from previous steps.
		route.fn(req, res, next, sh.routeCtx);
	};		
			
	var prerouteDone = function(proceed){
		if(!proceed){
			sh.error("Preroute processing failed for: " + route.relPath + " (" + route.fnName + ")");
			logErrors(req);
			return;
		}else{
			invokeRoute();
		}
	}		
	
	startReqPipeline(req, res, prerouteDone);		
}

function startReqPipeline(req, res, done){
	var route = req.route;
	req.sh = {flags:{}, errors:[]};
	res.sh = {};	
	var d = require('domain').create();
	d.add(req);
	d.add(res);
	d.add(sh);
	req.domain = d;
	d.on('error', function(er) {
		sh.error("Request Processing Error: " + er.stack);
		res.status(500).end("Internal Server Error.");
	});
	req.db = function(name, extraMods){
		return sh.db(name, d, route, extraMods);
	}						
	req.seq = function(name, options){
		return sh.seq(name, options, d);
	}												
	d.run(function(){
		invokeHooks("preroute", req, res, done);			
	});
}

exports.startReqPipeline = startReqPipeline;

function invokeHooks(hookType, req, res, done){
	var config = sh.appCtx.config;
	var globalHooks = sh.ext.hooks[hookType];
	var routeHooks = req.route.annotations.$hooks && 
					 req.route.annotations.$hooks[hookType];	
	var r=0,g=0;
	
	if(!routeHooks){
		routeHooks = [];
	}

	req.setFlag = function(flag, status, msg){
		req.sh.flags[flag] = true;
		req.sh.flagStatus = status;
		req.sh.flagMsg = msg;
	};
	req.resetFlag = function(flag){
		req.sh.flags[flag] = false;
	};
	
	var processNext = function(){
		if(req.sh.flags["abort"]){
			res.status(req.sh.flagStatus).end(req.sh.flagMsg);
			sh.error("Abort flag set for: " + req.url);
			done(false);
			return;
		}

		var terminate = false;
		var hook=false;
		while(!hook && !terminate){	
			if( (r < routeHooks.length) && 
				( (g >= globalHooks.length) ||
				  (routeHooks[r].priority <= globalHooks[g].priority) )
			){
				hook = routeHooks[r];
				r++;
			}else
			if(g < globalHooks.length){
				hook = globalHooks[g];
				g++;
			}else{
				terminate = true;
			}
			if(hook && hook.invokeIf){
				//console.log('HOOK', hook, req.sh.flags);
				for(var i=0;i<hook.invokeIf.length;i++){
					var invokeIf = hook.invokeIf[i];
					var flagValue;
					if(invokeIf.startsWith("!")){
						var f = invokeIf.substring(1);
						flagValue = !req.sh.flags[f];
					}else{
						flagValue = req.sh.flags[invokeIf];
					}
					if(!flagValue){
						hook = null;
						break;
					}
				}
			}
		}

		//console.log(hook);
				
		if(hook){
			process.nextTick(hook.handler.bind(null, req, res, processNext));
		}else{
			var fail = false;
			for(var i=0;i<config.preroute.requiredFlags.length;i++){
				if(!req.sh.flags[config.preroute.requiredFlags[i]]){
					fail = true;
					break;
				}
			}
			if(fail){
				res.status(401).end("Unauthorized");
				process.nextTick(done.bind(null, false));
			}else{
				process.nextTick(done.bind(null, true));
			}
		}
	}
	
	processNext();
}

function logErrors(req){
	for(var i=0;i<req.sh.errors.length;i++){
		sh.error(req.sh.errors[i]);
	}
}