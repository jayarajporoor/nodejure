/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var cluster = require("cluster");
var winston = require("winston");
 
shelloid.log = function(level, msg){
	if(cluster.isWorker){
		var msg = {isLog: true, logLevel: level, logMsg: msg};
		process.send(msg);
	}else{
		winston.log(level, msg);
	}
}

shelloid.info = function(msg){
	shelloid.log("info", msg);
}

shelloid.warn = function(msg){
	shelloid.log("warn", msg);
}

shelloid.error = function(msg){
	shelloid.log("error", sh.caller(msg));
}
