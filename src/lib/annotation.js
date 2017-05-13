/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
var fs = require("fs");
var path = require("path");
var liner = lib_require("liner");
var utils = lib_require("utils");

exports.parseAnnotations = function(loader, pathInfo, callback){
	var serverCtx = sh.serverCtx;
	var NONE = 0, SINGLE_QUOTED = 1, DOUBLE_QUOTED = 2, READING_KEY=3, READING_VALUE=4;
	var stringState = NONE;
	var annState = NONE;
	var inComment = false;
	var isDocComment = false;
	var annValue = "";
	var annKey = "";
	var charCodeA = "a".charCodeAt(0);
	var charCodeZ = "z".charCodeAt(0);
	var charCode0 = "0".charCodeAt(0);
	var charCode9 = "9".charCodeAt(0);
	var annotations = {
	};
	function newAnnotation(){
		return {
			$hooks :{},
			$addHook: function(hook){
				if(!this.$hooks[hook.type]){
					this.$hooks[hook.type] = [];
				}
				if(hook.priority === undefined){
					hook.priority = Infinity;
				}
				utils.priorityInsert(this.$hooks[hook.type], hook);
			}
		};
	};
	var annCurrent = newAnnotation();
	
	var idChar = function(c, extraSym){
		var n = c.toLowerCase().charCodeAt(0);
		return c == "_" || c == "-" ||  (n >= charCodeA && n <= charCodeZ) 
						||	(n >= charCode0 && n <= charCode9) || c == extraSym;
	}
	var linerObj = liner();
	var src = fs.createReadStream(pathInfo.path);
	src.pipe(linerObj);
	
	var processLine = 
	function(line) {
		line = " " + line.trim();//we need to collapse to at least a single whitespace
		if(line == " "){
			return;
		}		
		var prevChar = "";
		var skipChars = 0;
		var lineLength = line.length;
		
		var k = 0;
		var exportsPrefix = " exports.";
		var functionPrefix = " function";
		if(!inComment){
			if(stringState == NONE && 
			  (line.startsWith(exportsPrefix) || line.startsWith(functionPrefix)) ){
				var id = "";			  
				if(line.startsWith(exportsPrefix)){
					for(k=exportsPrefix.length;k<lineLength;k++){
						if(idChar(line[k])){
							id += line[k];
						}else{
							break;
						}
					}
					annotations[id] = annCurrent;
				}else
				{
					for(k=functionPrefix.length+1;k<lineLength;k++){
						if(idChar(line[k])){
							id += line[k];
						}else{
							break;
						}						
					}
					var fnPath = path.normalize(pathInfo.path) + "/" + id;
					sh.annotations[fnPath] = annCurrent;
				}
				annCurrent = newAnnotation();
			}else{
				annCurrent = newAnnotation();
			}
		}
		
		for(var i=k;i<lineLength;i++){
			var annReady = false;
			if(skipChars > 0){
				skipChars--;
				continue;			
			}
			var nextChar = (i+1) < lineLength ? line[i+1] : "";
			var charProcessed = false;
			
			if(stringState != NONE){
				charProcessed = true;
				if(prevChar != '\\'){
					if(stringState == SINGLE_QUOTED && line[i] == "'"){
						stringState = NONE;						
					}else
					if(stringState == DOUBLE_QUOTED && line[i] == '"'){
						stringState = NONE;
					}						
				}
			}else{
				if(line[i] == "'"){
					stringState = SINGLE_QUOTED;
					charProcessed = true;
				}else
				if(line[i] == '"'){
					stringState = DOUBLE_QUOTED;
					charProcessed = true;
				}
			}
					
			if(stringState == NONE && !charProcessed){			
				if(inComment){
					//using lookahead to detect end of comment to simplify detecting end of annValue
					if(line[i] == '*' && nextChar == '/'){
						charProcessed = true;
						inComment = false;
						if(annState == READING_KEY){
							annState = NONE;
							annReady = true;
						}
						isDocComment = false;
						skipChars = 1;
					}else
					if(isDocComment && line[i] == '@'){
						charProcessed = true;
						if(annState != NONE){
							annReady = true;
						}else{
							annKey = "";
							annValue = "";
						}
						annState  = READING_KEY;
					}
				}else{
					if(line[i] == '/' && nextChar == '*'){
						charProcessed = true;
						skipChars = 1;
						inComment = true;
						annCurrent = newAnnotation();
						var nextNextChar = (i+2) < lineLength ? line[i+2] : "";
						if(nextNextChar == '*'){
							skipChars++;
							isDocComment = true;
						}
					}
				}
			}
			if(annState == READING_KEY && !charProcessed){				
				if(	idChar(line[i], ".")){
					annKey += line[i];
				}else{
					annState = READING_VALUE;
				}
			}
			
			if(annState == READING_VALUE){
				if(!inComment){
					annReady = true;
					annState = NONE;
				}else{
					annValue += line[i];
				}
			}
				
			if(annReady){
				annValue = annValue.trim();
				if(annKey != ""){
					try{
						var doNext = true;
						var keyFields = annKey.split(".");				
						var valueObj;
						var processors = getProcessors(loader, keyFields);
						if(processors && processors.length > 0){
							for(var i=0;i<processors.length;i++){
								var val = annValue;
								if(!processors[i].raw){
									if(!valueObj && annValue != ""){
										eval("valueObj = " + annValue);
									}
									val = valueObj;
								}
								doNext = processors[i].process(annCurrent, 
															keyFields, val);
								if(!doNext){
									break;
								}
							}
						}
						
						if(doNext){
							if(annValue == ""){
								annValue = "true;";
							}
							eval("valueObj = " + annValue);
							annCurrent[annKey] = valueObj;							
						}
						
					}catch(err){
						console.log("ERR: Syntax error in the annotation value for @" 
									+ annKey + ": " + err.stack + " in the file " + pathInfo.path + " Value: " + annValue);
						serverCtx.appCtx.hasErrors(true);
					}
				}
				annKey = ""; 
				annValue = "";
				if(annState == READING_VALUE){
					annState = NONE;
				}
			}
			
			prevChar = line[i];
		}
	};	
	
	linerObj.on('readable', function () {
		var line;
		while (line = linerObj.read()) {
			processLine(line);
		}

	})
	
	linerObj.on("end", function(){
		callback(pathInfo, annotations);
	});
	
}

function getProcessors(loader, keyFields){
	var processors = sh.ext.annotationProcessors;
	var res = [];
	if(keyFields.length > 1)
	{
		var ns = keyFields[0];		
		for(var i=0;i<keyFields.length-1;i++){
			var processor = processors[ns];
			if(processor){
				res.unshift(processor);
			}
			processor = loader.annotationProcessors[ns];
			if(processor){
				res.unshift(processor);
			}
			ns = ns + "." + keyFields[i+1];
		}
		return res;
	}else{
		//optimized version
		var processor = processors[keyFields[0]];
		if(processor){
			res.unshift(processor);
		}
		var processor = loader.annotationProcessors[keyFields[0]];
		if(processor){
			res.unshift(processor);
		}		
		return res;
	}
}
