/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
var fs = require('fs-extra');
var utils = lib_require("utils");
var path = require("path");

module.exports = function(basePath, appName){
	var namePattern = /^[a-zA-Z0-9-_]+$/;
	if(!namePattern.test(appName)){
		console.log("App name: " + appName + " cannot contain special characters");
		return;
	}
	var srcPath = path.join(basePath, "/app-template");
	var targetPath = path.resolve(appName);
	if(utils.dirExists(targetPath) && fs.readdirSync(targetPath).length > 0){
		console.log("Target folder: " + appName + " not empty");
	}else{
		fs.copySync(srcPath, targetPath);
		var appJsonFile = path.join(targetPath, "/package.json");	
		var json = utils.readJsonFile(appJsonFile, "Application JSON");
		json.name = appName;
		utils.writeJsonSync(appJsonFile, json);
		console.log("Shelloid application " + appName + " is initialized.");
		console.log("To start the application execute: shelloid " + appName);
		console.log("Once running you may open the application in browser at http://localhost:8080");
		console.log("Please report any issues at the community forum - link available at http://shelloid.org");
		console.log("Have a great time using Shelloid!");
	}
}

