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
var fs = require("fs");
var assert = require("assert");
var utils = lib_require("utils");
var obj = lib_require("obj");

exports.installGlobals = function(){
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};

	String.prototype.startsWith = function (str){
		return this.indexOf(str) == 0;
	};
	Array.prototype.contains = function(obj){
		return this.indexOf(obj) >= 0;
	}
	global.shelloid = {};
	global.sh = shelloid;
	shelloid.getDBConfig = function(dbname){
		return shelloid.serverCtx.appCtx.config.databases[dbname];
	}	
	obj.installGlobals();	
	sh.require = require("./lib/sys_require.js");//for app code to require Shelloid's node_modules
	sh.seq = lib_require("ctrl/seq");
	sh.annotations = {};	
	sh.services = {};
	sh.hookPriorities = {
		preAuth: -50,
		auth: 0,
		authr: 50,
		postAuth: 100,
		start: -100,
		veryEarly: -50,
		early: 0,
		mid: 50,
		late: 100,
		veryLate: 150,
		end: 500
	};	
}

exports.loadAppConfig = function(appCtx){
	var configFile = utils.envConfig(appCtx, appCtx.basePath, ".json");

	if(utils.fileExists(configFile)){
		var configTxt = fs.readFileSync(configFile, "utf-8");
		try{
			var config = JSON.parse(configTxt);
		}catch(err){
			console.log("Error parsing config.json: " + configFile + " : " + err);
			process.exit(0);
		}
			
		var config = appCtx.config = utils.merge(appCtx.config, config);
		assert(config.dirs.data !== undefined);
		config.dirs._data = config.dirs.data;//save for later reference
		config.dirs.data = path.normalize(path.resolve(appCtx.basePath, config.dirs.data));		
		utils.mkdirIfNotExists(config.dirs.data, 
								"Data directory: " + config.dirs._data + 
								"(" + config.dirs.data+ ") does not exist. Trying to create one.");								
		config.dirs._uploads = config.dirs.uploads;
		config.dirs.uploads = path.resolve(config.dirs.data, config.dirs.uploads);
		utils.mkdirIfNotExists(config.dirs.uploads, 
							"Uploads directory: " + config.dirs.uploads + 
							"(" + config.dirs.uploads+ ") does not exist. Trying to create one.");

		config.log._file = config.log.file;
		config.log.file = path.resolve(config.dirs.data, config.log.file);
		
		config.baseUrl = config.proto + "://" + config.domain;
		if(!((config.port == 80 && config.proto == "http") || 
		   (config.port == 443 && config.proto == "https"))){
			config.baseUrl = config.baseUrl + ":" + config.port;
		}
		console.log(config.baseUrl);
		var dateFormatInt = {"string": 0, "date": 1, "moment": 2};
		config.validate.req.dateFormatInt = dateFormatInt[config.validate.req.dateFormat];
		config.validate.res.dateFormatInt = dateFormatInt[config.validate.res.dateFormat];		

		config.dirs._ext = config.dirs.ext;
		config.dirs.ext  = path.resolve(appCtx.basePath, config.dirs.ext);		

		config.dirs._extMon = config.dirs.extMon;
		config.dirs.extMon  = path.resolve(appCtx.basePath, config.dirs.extMon);		
		
		config.dirs._ccs = config.dirs.ccs;
		config.dirs.ccs  = path.resolve(appCtx.basePath, config.dirs.ccs);		
		
		config.ccs.configPath = utils.envConfig(appCtx, config.dirs.ccs, ".clj");

		config.dirs._ccsApp = config.dirs.ccsApp;
		config.dirs.ccsApp  = path.resolve(appCtx.basePath, config.dirs.ccsApp);		
		
		config.dirs._views = config.dirs.views;
		config.dirs.views = path.resolve(appCtx.basePath, appCtx.config.dirs.views);
		config.dirs._pubThemes = config.dirs.pubThemes;
		config.dirs.pubThemes = path.resolve(appCtx.basePath, config.dirs.pubThemes);
		config.dirs._pub = config.dirs.pub;
		config.dirs.pub  = path.resolve(appCtx.basePath, config.dirs.pub);		
		config.https._key = config.https.key;
		config.https._cert = config.https.cert;
		config.https._pfx = config.https.pfx;
		config.https._ca = config.https.ca;
		config.https.key = config.https.key ? path.resolve(appCtx.basePath, config.https.key) : null;
		config.https.cert = config.https.cert ? path.resolve(appCtx.basePath, config.https.cert) : null;
		config.https.pfx = config.https.pfx ? path.resolve(appCtx.basePath, config.https.pfx) : null;
		if(!utils.isArray(config.https.ca)){
			config.https.ca = [config.https.ca];
		}
		for(var i=0;i<config.https.ca.length;i++){
			if(config.https.ca[i]){
				config.https.ca[i] = path.resolve(appCtx.basePath, config.https.ca[i]);
			}
		}
	}else{
		if(appCtx.env && appCtx.env != ""){
			console.log("Cannot find the configuration file for the environment: " + appCtx.env + ". Exiting.");
			process.exit(0);
		}else{
			console.log("Application config file does not exist. Using defaults");
		}
	}
}

exports.serverCtx = function(pathParam, envName){	
	
	var appBasePath = checkAppBasePath(pathParam);

	var packageJsonPath = path.normalize(path.join(__dirname,  "../package.json"));
	var packageJson = utils.readJsonFile(packageJsonPath, "Shelloid package.json");
	
	if(utils.isString(packageJson)){
		console.log(packageJson);//this is an error string
		process.exit(0);
	}
	var appPackageJsonPath = path.normalize(path.join(appBasePath,  "/package.json"));
	var appPackageJson = utils.readJsonFile(appPackageJsonPath, "Application package.json");
	if(utils.isString(appPackageJson)){
		console.log(appPackageJson);//this is an error string
		process.exit(0);
	}

	var ctx = 
	{
		packageJsonPath : packageJsonPath,
		packageJson: packageJson,
		basePath: path.normalize(path.join(__dirname, "..")),
		pools:{
		},
		appCtx :{			
			env: envName,
			hasErrors: function(flag){
				if(flag !== undefined){
					if(flag){
						console.log("Application has errors. Called by:" + 
										sh.caller());				
					}
					this.flagErrors = flag;
				};
				return this.flagErrors;
			},
			flagErrors: false,
			basePath: appBasePath,
			packageJsonPath: appPackageJsonPath,
			packageJson: appPackageJson,
			packageJsonModified: false,
			routes: [],
			authMods : [],
			customAuths: {},
			interfaces: {},
			app: null,
			folders:{
				routes: null,
				auth: null,
				interfaces:null,
				sim: null,
				themes: null
			},
			config: {
				mon: {
					ext: ["ccs-server"]
				},
				theme: null,
				hosts: {
					//host name :{theme : xxx}
				},
				viewEngine : "ejs",
				autoRestart:{
					thresholdMillis: 3000,
					appUpdate: true,
					serverUpdate: true
				},
				preroute:{
					requiredFlags : ["auth", "authr"]
				},
				extensions:[
					//{name: "", version: ""}
				],
				shutdownWaitMillis: 10*1000,
				appModules:["routes", "auth", "interfaces", "streams", "libmod"],
				dirs : {
					pub: "src/public",
					views: "src/views",
					pubThemes: "src/themes",
					data: "data",
					uploads: "uploads",
					init: "src/init.js",
					ext: "src/ext",
					extMon: "src/ext-mon",
					ccs: "ccs",
					ccsApp: "ccs/app" 
				},			
				enableCluster: false,
				domain: "localhost",
				proto: "http",
				port: 8080,
				baseUrl: null, //computed dynamically
				stream:{
					db: null,
					routeBase: "/stream"
				},
				ccs:{
					services: [],
					host: "localhost",
					port: 9090,
					enable: false,
					retryMillis: 8000,
					configPath: null, //dynamically computed from dirs.ccs.		
				},
				log:{
					accessLogs: true,
					file : "shelloid.log", //relative to data dir
					level: "verbose"
				},
				https:{
					enable: false,
					//https options. Give file names for key/cert/pfx/ca, optional passphrase.
				},
				nodes:{
					//key value pairs of the form: node name : IP or host name
				},
				node:{
					addressTypes:["IPv4"],
					interfaces: [],
					is:{}, //e.g. is.nodename is true if the current host is the named node.
					ips:[],//list of node IPs
					names:[] //list of node names
				},
				allowDomains:[],//structure: {enable: true, cookies: true, domain: string, "*" or regex}
				validate:{
					req:{
						dateFormat: "moment",//moment, date, string
						dateFormatInt: 2,//int values for faster runtime processing
										 //0: string, 1: date, 2: moment
						safeStrings: true
					},
					res: {
						dateFormat: "string",
						dateFormatInt: 0,
						safeStrings : true
					}
				},
				auth:{
					logout: {
						path: "/logout",
						redirect: "/"
					},
					prefix: "/auth",
					successRedirect: "/home",
					failureRedirect: "/",
					facebook:{
						appId: null,
						appSecret: null
					},
					twitter:{
						consumerKey: null,
						consumerSecret: null
					}
				},
				session:
				{
					name: "connect.sid",
					secret: "secret",
					store : null,/*defaults to in-memory store. else give name of the database*/
				},
				databases:
				{
					/*database name => 
					{type (mongodb, redis, mysql), host, port, username, password, other params}
					*/
				},
				services:{
					//service-specific configs
				}
			}			
		},
	};
	
	return ctx;
}

exports.appInit = function(done){
	var initJs = path.resolve(sh.serverCtx.appCtx.basePath, sh.serverCtx.appCtx.config.dirs.init);	
	sh.routeCtx = {config: sh.serverCtx.appCtx.config, env: sh.serverCtx.appCtx.env, app: sh.serverCtx.appCtx};
	if(utils.fileExists(initJs)){
		var init = require(initJs);
		if(utils.isFunction(init)){
			init(sh.routeCtx, done);
		}else{
			sh.error("The init script " + initJs + " must have a function assigned to module.exports");
			process.exit(0);
		}		
	}else{
		done();
	}
}


function checkAppBasePath(pathParam){
	var basePath = path.normalize(path.resolve(pathParam));
	if(!utils.dirExists(basePath)){
		console.log("The provided path: " + pathParam + 
					" (resolves to " + basePath + ") is not a directory");
		process.exit(0);	
	}
	return basePath;
}

