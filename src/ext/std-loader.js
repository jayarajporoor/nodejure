/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
 
module.exports = function(){
	return extInfo;
} 

var extInfo = 
{
	hooks:[	{type: "load", name: "auth", handler: authLoad},
			{type: "load", name: "routes", handler: routeLoad},
			{type: "load", name: "interfaces", handler: interfaceLoad},
			{type: "load", name: "libmod", handler: libmodLoad},
	]
};

function authLoad(loader, mod){
	var appCtx = sh.appCtx;
	if(!appCtx.authMods){
		appCtx.authMods = [];
	}	
	appCtx.authMods.push(mod);
}

function authLoad(loader, mod){
	var appCtx = sh.appCtx;
	if(!appCtx.authMods){
		appCtx.authMods = [];
	}	
	appCtx.authMods.push(mod);
}

function routeLoad(loader, mod){
	var appCtx = sh.appCtx;
	if(!appCtx.routes){
		appCtx.routes = [];
	}	
	appCtx.routes.push(mod);
}

function interfaceLoad(loader, mod){
	var appCtx = sh.appCtx;
	if(!appCtx.interfaces){
		appCtx.interfaces = {};
	}	
	appCtx.interfaces[mod.url] = mod;
}

function libmodLoad(loader, mod){
	var appCtx = sh.appCtx;
	if(!appCtx.libmod){
		appCtx.libmod = {};
	}	
	console.log('Loaded libmod ' + mod.url);
	appCtx.libmod[mod.url] = mod;
}
