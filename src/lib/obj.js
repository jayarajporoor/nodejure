/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

exports.installGlobals = function(){	 
	Object.defineProperty(global, '__stack', {
	get: function() {
			var orig = Error.prepareStackTrace;
			Error.prepareStackTrace = function(_, stack) {
				return stack;
			};
			var err = new Error;
			Error.captureStackTrace(err, arguments.callee);
			var stack = err.stack;
			Error.prepareStackTrace = orig;
			return stack;
		}
	});

	Object.defineProperty(global, '__caller2_line', {
	get: function() {
			return __stack[3].getLineNumber();
		}
	});

	Object.defineProperty(global, '__caller2_function', {
	get: function() {
			return __stack[3].getFunctionName();
		}
	});

	Object.defineProperty(global, '__caller2_file', {
	get: function() {
			return __stack[3].getFileName();
		}
	});

	Object.defineProperty(global, '__caller_line', {
	get: function() {
			return __stack[2].getLineNumber();
		}
	});

	Object.defineProperty(global, '__caller_function', {
	get: function() {
			return __stack[2].getFunctionName();
		}
	});

	Object.defineProperty(global, '__caller_file', {
	get: function() {
			return __stack[2].getFileName();
		}
	});

	Object.defineProperty(global, '__line', {
	get: function() {
			return __stack[1].getLineNumber();
		}
	});

	Object.defineProperty(global, '__function', {
	get: function() {
			return __stack[1].getFunctionName();
		}
	});

	Object.defineProperty(global, '__file', {
	get: function() {
			return __stack[1].getFileName();
		}
	});

	shelloid.caller = function(str){
		if(!str){
			str = "";
		}else{
			str = ": " + str;
		}
		var fn = __caller2_function || "internal function";
		return __caller2_file +":" + __caller2_line+"("+ fn + ")" + str;
	}

	shelloid.loc = function(str){
		if(!str){
			str = "";
		}else{
			str = ": " + str;
		}
		var fn = __caller_function || "internal function";	
		return __caller_file +":" + __caller_line+"("+ fn + ")" + str;
	}
}