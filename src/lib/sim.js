/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

 var path = require("path");
 var utils = lib_require("utils");
 var route = lib_require("route");
 var url = require("url");
 exports.init = function(){
	sh.sim = {};
	sh.sim.route = simRoute;
	sh.sim.seq = lib_require("sim/seq");
	sh.sim.concur = lib_require("sim/concur");
	initSimApp();
 }
 
 exports.enterSimMode = function(){
	sh.serverCtx.simMode = true;
	var simJs = path.join(sh.serverCtx.appCtx.config.dirs.sim, "/main.js");
	if(utils.fileExists(simJs)){
		var simMain = require(simJs);
		if(!utils.isFunction(simMain)){
			sh.error("Simulator script: " + simJs + " must have a function assigned to module.exports");
			process.exit(0);
		}
		
		sh.serverCtx.appCtx.app = new SimApp();
		route.addAll(sh.serverCtx.appCtx);
		sh.info("Starting simulator run.");
		simMain(function(){
			sh.info("Simulator run over.");
			process.exit(0);
		});
	}
 }
 
 function simRoute(req, res){
	var routes = sh.serverCtx.appCtx.app.routes;
	var foundRoute=null;
	if(!req.method || !req.url){
		sh.error("Mandatory request parameters not found (method/url)");
		res.status(400, "Bad Request");
		return;
	}
	var method = req.method.toLowerCase();
	var urlComponents = url.parse(req.url);
	var reqPath = urlComponents.path;
	for(var i=0;i<routes.length;i++){
		var route = routes[i];
		for(var j=0;j<route.path.length;j++){
			var routePath = route.path[j];
			if(route.method !== req.method){
				continue;
			}
			if(utils.isString(routePath)){
				if(reqPath == routePath){
					foundRoute = route;
					break;
				}
			}else
			if(utils.isRegExp(routePath)){
				if(routePath.test(reqPath)){
					foundRoute = route;
					break;
				}
			}
		}
	}
	
	defaultHandlers(req, res, foundRoute);	
	
	if(foundRoute){
		foundRoute.fn(req, res, sh.routeCtx);
	}else{
		sh.info("Route for: " + req.url + "(" + req.method + ") not found");
		res.status(404).end("Not Found");
	}
 }

function defaultHandlers(req, res, route){
	if(!req.status){
		res.status = function(s){
			console.log("Response status: " + s + " for " + req.url);
			res.status = s;
			return res;
		}
	}
	
	var fn = function(obj){
		console.log("Response for " + req.url, obj);
		return res;
	}	
	
	res.write = res.write || fn;
	res.end = res.end || fn;
	res.render = res.render || fn;
	res.json = res.json || fn;
	res.send = res.send || fn;	
}
 
 function SimApp(){
	this.routes = [];
 }
 
SimApp.prototype.method = function(method, path, fn){
	if(!utils.isArray(path)){
		path = [path];
	}
	var route = {path: path, fn: fn, method: method.toLowerCase()};	
	this.routes.push(route);
}

var methods = ["get", "post", "delete", "options", "all"];

function initSimApp(){
	for(var i =0;i<methods.length;i++){
		var method = methods[i];
		SimApp.prototype[method] = utils.partial(SimApp.prototype.method, method);
	}
} 
