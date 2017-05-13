/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
var fs = require("fs"),
	path = require("path"),
	events = require('events'),
	assert =require("assert");	

exports.is = function (obj, type) {
    var clz = Object.prototype.toString.call(obj).slice(8, -1);
    return obj !== undefined && obj !== null && clz === type;
}

exports.recurseDirSync = function(path){
	var res = [];
	var maxRecurse = 50;
	recursiveDirSync2(path, false, res, maxRecurse);
	return res;
}

exports.dirExists = function(path){
	var isDirectory = false;
	try{
		isDirectory = fs.lstatSync(path).isDirectory();
	}catch(err){
	}
	return isDirectory;
}

exports.fileExists = function(path){
	var isFile = false;
	try{
		isFile = fs.lstatSync(path).isFile();
	}catch(err){
	}
	return isFile;
}

exports.merge = function(obj1, obj2){
	return mergeRecursive(obj1, obj2);
}

exports.isAbsolutePath = function(p){
	return p.startsWith("/") || p.startsWith("\\") || (p.search(/.:[\/\\]/) >= 0)
}

exports.readJsonFile = function(filePath, infoTxt){
	var res = "Unknown Error";
	if(module.exports.fileExists(filePath)){
		var txt = fs.readFileSync(filePath, "utf-8");
		try{
			res = JSON.parse(txt);
		}catch(err){
			res = "Error parsing the Json file: " + infoTxt + "(" + filePath + "). Error: " + err;
			return res;
		}
	}else{
		res = "Couldn't find the Json file: " + infoTxt + "(" + filePath + ")";
	}
	return res;
}


exports.mkdirIfNotExists = function(dir, logMsg){
	if(!module.exports.dirExists(dir)){
		if(logMsg){
			console.log(logMsg);
		}
		fs.mkdirSync(dir);
	}
}

var toString = Object.prototype.toString;

exports.isString = function(obj){
  return obj && toString.call(obj) === '[object String]';
}
exports.isArray = function(obj){
	return obj && obj.constructor === Array;
}

function isObject(obj){
	return obj && toString.call(obj) === "[object Object]";
}

exports.isObject = isObject;

exports.getProp = function(obj, p){
	if(!isObject(obj))
		return null;
	else
		return obj[p];
}

exports.isFunction = function(obj){
	return (typeof obj) == "function";
}

exports.isRegExp = function(obj){
	return (obj instanceof RegExp);
}

exports.countingBarrier = function(count, done){
	if(count <= 0){
		process.nextTick(done);
		return;
	}
	var sync = new events.EventEmitter();
	sync.on("count-down", function(){
		count--;
		if(count <= 0){
			done();
		}
	});
	
	return {
		countDown: function(){
			sync.emit("count-down");	
		}
	}
}

exports.writeJsonSync = function(filePath, obj){
	fs.writeFileSync(filePath, JSON.stringify(obj, null, 4));
}

function mergeRecursive(obj1, obj2) {
  for (var p in obj2) {
    try {
      if ( obj2[p].constructor==Object ) {
        obj1[p] = mergeRecursive(obj1[p], obj2[p]);
      } else {
        obj1[p] = obj2[p];
      }
    } catch(e) {
      obj1[p] = obj2[p];
    }
  }

  return obj1;
}

function recursiveDirSync2(currPath, relPath, res, remRecurse){
	if(remRecurse <= 0){
		throw new Error("recursiveDirSync: Maximum recursion depth reached");
	}
	
	var entries = fs.readdirSync(currPath);
	for(var i =0;i<entries.length;i++){
		if(entries[i] != "." && entries[i] != ".."){
			var entryPath = currPath + "/" + entries[i];
			entryRelPath = relPath ? relPath + "/" + entries[i] : entries[i];
			var stat = fs.lstatSync(entryPath);
			if(stat.isDirectory()){
				recursiveDirSync2(entryPath, entryRelPath, res, remRecurse - 1 );
			}else
			if(stat.isFile()){
				res.push({path: path.normalize(entryPath), relPath: entryRelPath});
			}
		}
	}
}

exports.partial = function(fn){
	var savedArgs = Array.prototype.slice.call(arguments, 1);
	return function(){
		var args = savedArgs.concat(Array.prototype.slice.call(arguments, 0));
		return fn.apply(this, args);
	}
}

exports.priorityInsert = function(array, obj){
	assert(Array.isArray(array));
	if(!obj.priority && obj.priority != 0){
		obj.priority = Infinity;		
		array.push(obj);		
		return;
	}
	
	var i=0;
	for(i=0;i < array.length;i++){
		var e = array[i];
		//greater numeric value means lesser priority
		if(e.priority >= obj.priority){
			break;
		}
	}
	
	if(i >= array.length){
		array.push(obj);
	}else{
		array.splice(i, 0, obj);
	}
}

exports.envConfig = function(appCtx, basePath, ext){
	var suffix = (!appCtx.env || appCtx.env == "") ? ext : "." + appCtx.env + ext;
	var configPath = path.join(basePath, "config" + suffix);
	return configPath;
}

exports.replaceAll = function(str, from, to){
  return str.replace(new RegExp(from, 'g'), to);
}

exports.firstChild = function(obj){
	for(var k in obj){
		if(obj.hasOwnProperty(k)){
			return obj[k];
		}
	}
	return null;
}

const charCodeA = "a".charCodeAt(0);
const charCodeZ = "z".charCodeAt(0);
const charCode0 = "0".charCodeAt(0);
const charCode9 = "9".charCodeAt(0);

exports.idChar = function(c){
	var n = c.toLowerCase().charCodeAt(0);
	return c == "_" || 
		   (n >= charCodeA && n <= charCodeZ) ||
		   (n >= charCode0 && n <= charCode9);
}

exports.isWhitespace = function(c){
	return c === " " || c === "\t" || c === "\r" ||
	       c === "\n";
}

