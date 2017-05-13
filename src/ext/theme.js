/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
var url = require("url");
var path = require("path");
var utils = lib_require("utils");
var fs = require("fs");
var moment = require("moment");

module.exports = function(){
	return extInfo;
} 

var extInfo = 
{
	hooks:[
	{type: "prerender", handler: prerenderHook},
	{type: "preprocess", handler: themeMiddleware},
	{type: "init", handler: initTheme, 
	   priority: sh.hookPriorities.late}
	],
	services:{
		theme: {
			setTheme : setTheme
		}
	}
};

function themeMiddleware(req, res, next){
	try{
		theme(req, res, next);
	}catch(err){
		sh.error("Theme processing error: " + err.stack);
		throw new Error("Theme Processing Error");
	}
}

function prerenderHook(req, res, done){
	var domainConfig = sh.appCtx.config.hosts[req.headers.host];	
	if(domainConfig && domainConfig.theme){
		theme = domainConfig.theme;					
	}
	done();
}

function theme(req, res, next){
	var domainConfig = sh.appCtx.config.hosts[req.headers.host];	
	var reqPath = url.parse(req.url).pathname;
	var themedPublic = sh.appCtx.config.dirs.themedPublic;
	if(domainConfig && domainConfig.theme){
		themedPublic = path.resolve(sh.appCtx.config.dirs.pubThemes, domainConfig.theme);
	}	
	var themePath = path.join(themedPublic, reqPath);
	var ext = path.extname(reqPath);
	req.times = {start: moment()};
	//log the request 
	if(sh.appCtx.config.log.accessLogs){
		sh.info(req.times.start.format() + ":" + req.method + ":" + req.url);
	}
	
	if(utils.dirExists(themePath)){
		
		themePath = path.join(themePath, "index.html");
		ext = ".html";
	}
	if(utils.fileExists(themePath) && contentType[ext]){
		fs.stat(themePath, function(err, stat){
			if(err){
				console.log("Could not stat theme file: " + themePath + ". Falling back to default folder.");
				next();
			}else{
				res.statusCode = 200;
				res.setHeader("Content-Type", contentType[ext]);			
				res.setHeader("Content-Length", stat.size);
				var readStream = fs.createReadStream(themePath);
				readStream.pipe(res);
			}
		});
	}else{
		next();
	}
} 

var contentType = {
	".css": "text/css",
	".html": "text/html",
	".htm": "text/html",	
	".txt": "text/plain",
	".js" : "application/javascript",
	".png" : "image/png",
	".jpeg" : "image/jpeg",
	".jpg" : "image/jpeg",
	".gif" : "image/gif",
	".ico" : "image/x-icon"
}


function setTheme(theme){
	var config = sh.serverCtx.appCtx.config;
	config.theme = theme;
	setTheme_(config);
}

function setTheme_(config){
	if(config.theme && config.theme !== ""){
		config.dirs.themedPublic = path.resolve(config.dirs.pubThemes, config.theme);
		config.dirs.themedViews = path.resolve(config.dirs.views, "themes", config.theme);
	}else{
		config.theme = "";
		config.dirs.themedPublic = "";
		config.dirs.themedViews = "";
	}	
}

function initTheme(done){
	setTheme_(sh.serverCtx.appCtx.config);
	done();
}