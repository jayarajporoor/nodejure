/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
var utils = lib_require("utils");
 
module.exports = function(){
	return extInfo;
} 

var extInfo = 
{
	hooks:[
	{type: "preroute", handler: handleCors, priority: sh.hookPriorities.preAuth, 	invokeIf: null},
	{type: "init", handler: initCors, priority: 
	sh.hookPriorities.late}
	]
};

function handleCors(req, res, done){
	//console.log("CORS HANDLING ", req.headers.origin );
	var config = sh.serverCtx.appCtx.config;
	if(config.allowDomains.length > 0){
		handleCors0(req, res, config.allowDomains);
	}
	done();
}

function handleCors0(req, res, allowDomains){
	var route = req.route;
	if(route.annotations.allowDomains === false){
		sh.error("Cross origin request for " + req.url + " for which @allowDomains is false");
		req.setFlag("abort", 403, "Forbidden");
		return;
	}
	var origin = req.headers.origin ? req.headers.origin.toLowerCase() : "*";
	var ok = false;
	for(var i=0;i<allowDomains.length;i++){
		var allow = allowDomains[i];
		var domain = allow.domain;
		if(domain == "*" || (domain == origin) || (allow.isRegExp && allow.domain.test(origin))){
			res.setHeader("Access-Control-Allow-Origin", origin);
			if(allow.cookie){
				res.setHeader("Access-Control-Allow-Credentials", "true");			
			}
			var methods = req.headers["Access-Control-Request-Method"];
			if(methods){
				methods = "GET, POST, OPTIONS, " + methods;
				res.setHeader("Access-Control-Allow-Methods", methods);
			}
			var headers = req.headers["Access-Control-Request-Headers"];
			if(headers){
				res.setHeader("Access-Control-Allow-Headers", headers);
			}			
			res.setHeader("Access-Control-Max-Age", "1728000");
			ok = true;
			break;
		}
	}
	
	if(!ok){
		req.setFlag("abort", 403, "Forbidden");
	}
}

function initCors(done){
	var config = sh.appCtx.config;
	if(!utils.isArray(config.allowDomains)){
		sh.error("Configuration error: config.allowDomains must be an array (can be empty or left unspecified.)");
		sh.hasErrors = true;
	}else{
		for(var i=0;i<config.allowDomains.length;i++){
			var allow = config.allowDomains[i];
			if(utils.isRegExp(allow.domain)){
				allow.isRegExp = true;
			}else{
				allow.domain = allow.domain.toLowerCase();
			}
		}
	}
	done();
}