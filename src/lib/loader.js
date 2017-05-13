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
var annotation = lib_require("annotation");

exports.loadAll = function(done){
	var config = sh.appCtx.config;
	var barrier = utils.countingBarrier(config.appModules.length, done);
	for(var i=0;i<config.appModules.length;i++){
		var modName = config.appModules[i];
		var p = config.dirs[modName];
		if(!p){
			p = "src/" + modName;
		}
		p = path.normalize(path.resolve(sh.appCtx.basePath, p));
		var hooks = sh.ext.hooks["load"];
		for(var j=0;j< hooks.length;j++){
			var hook = hooks[j];
			if(hook.name == modName){
				gotHook = true;
				break;
			}
		}
		if(gotHook){
			var loader = {hook:hook, modType: modName, modPath : p, 
				annotationProcessors:{}};
			loadModules(loader, barrier.countDown.bind(barrier));
		}else{
			sh.warn("No loader found for: " + modName);
			barrier.countDown();
		}
	}
}

function loadModules(loader, done){	
	var modPath = loader.modPath;
	var modType = loader.modType;
	var serverCtx = sh.serverCtx;
	if(!utils.dirExists(modPath)){
		console.log("The " + modType + " folder does not exist: " + modPath);
		process.nextTick(done);
		return;		
	}	
	var modPathLength = modPath.length;
	var paths = utils.recurseDirSync(modPath);
	var barrier = utils.countingBarrier(paths.length, done);
	
	for(var i=0;i<paths.length;i++){
		if(paths[i].path.endsWith(".js")){
			console.log("Processing: " + paths[i].path + " (" + modType + ")" );
			annotation.parseAnnotations(loader, paths[i],  
				function(pathInfo, annotations){
					if(!annotations){
						annotations = {};
					}
					var baseUrl = pathToURL(pathInfo.path, modPathLength);			
					var url = baseUrl;
					var m;
					try{
						m = require(pathInfo.path);
					}catch(e){
						console.log("Error loading module " + pathInfo.path + ": " + e + " at " + e.lineNumber +":" + e.columnNumber);
						return;
					}
					var coll = {};
					for(f in m){
						if(m.hasOwnProperty(f)){
							if(f != "index"){
								url = baseUrl + "/" + f;
							}
							var ann = 
							m[f].annotations || annotations[f];
							if(!ann){
								ann = {};
							}
							var fn = m[f].fn || m[f];
							if(!ann.ignore){
								var mod = 
									{
										loader: loader,
										type: modType,
										fn: fn,
										fnName: f,
										annotations: ann,
										path: pathInfo.path,
										relPath : pathInfo.relPath,
										url: url,
										coll: coll
									};
								coll[f] = mod;
							}else{
								console.log("Ignoring app module with @ignore: " + 
																pathInfo.relPath + " (" + f + ")");
							}
						}
					}
					for(name in coll){
						var mod = coll[name];
						loader.hook.handler(loader, mod);
					}
					barrier.countDown();
				}
			);
		}else{
			barrier.countDown();
		}
	}
}

function pathToURL(path, basePathLength){
	var relPath = path.substring(basePathLength);//remove base path
	var url = relPath.replace(/\\/g, "/");
	var re = url.endsWith("index.js") ?  new RegExp("/?index.js$") : new RegExp("\.js?");
	url = url.replace(re, "");
	if(url[0] != "/"){
		url = "/" + url;
	}
	return url;
}