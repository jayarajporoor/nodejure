/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var moment = require("moment");
var util = require("util");
var validator = require("validator");

module.exports = function(){
	return {};
} 

function OptionalParam(val){
	this.value = val;
}

global.optional = function(val){
	return new OptionalParam(val);
}

global.str = function(v){
	return toString.call(v) == '[object String]';
}

str.typename = "str";

str.safe = function(v){
	//return str(v) && !/[<>\r\n\"\';,]/.test(v);
	return str(v) && !/[<>\r\n]/.test(v);
}

str.extra_safe = function(v){
	return str(v) && !/[<>\r\n\"\';,]/.test(v);
}

str.email = function(v){
	return str(v) && validator.isEmail(v);
}

str.url = function(v){
	return str(v) && validator.isURL(v);
}

str.alpha = function(v){
	return str(v) && validator.isAlpha(v);
}

str.alphanumeric = function(v){
	return str(v) && validator.isAlphanumeric(v);
}

str.ip = function(v){
	return str(v) && validator.isIP(v);
}

str.creditcard = function(v){
	return str(v) && validator.isCreditCard(v);
}

global.num = function(v){
	return (typeof v) == "number";
}

num.typename = "num";

global.array = function(v){
	return v.constructor == Array;
}

array.typename = "array";

global.bool = function(v){
	return v === true || v === false;
}

bool.typename = "bool";

global.date = function(v, validateConfig){
	var isMoment = moment.isMoment(v);
	if(!( str(v) || isMoment || util.isDate(v))){
		return false;
	}
	var m = isMoment? v : moment(v);
	if(!m.isValid()){
		return false;
	}
	
	if(validateConfig.dateFormatInt == 0)
		return m.toString();
	else if(validateConfig.dateFormatInt == 1)
		return m.toDate();
	else if(validateConfig.dateFormatInt == 2)
		return m;
	return true;	
}

date.typename = "date";

global.any = function(){
	return true;
}
any.typename = "any";

num.integer = function(v){
	return num(v) && ((v % 1) == 0);
}
num.integer.typename = "num.integer";

num.integer.range = function(from, to){
	var f = function(v){
		return num.integer(v) && v >= from && v <= to;
	}
	f.typename = "num.integer.range(" + from + "," + to + ")";	
	return f;	
}

num.integer.max = function(to){
	var f= function(v){
		return num.integer(v) && v <= to;
	};
	f.typename = "num.integer.max(" + to + ")";	
	return f;
}

num.integer.min = function(from){
	var f= function(v){
		return num.integer(v) && v >= from;
	};
	f.typename = "num.integer.min(" + from + ")";	
	return f;
}

num.range = function(from, to){
	var f = function(v){
		return num(v) && v >= from && v <= to;
	};
	f.typename = "num.range(" + from + "," + to + ")";
	return f;
}

num.max = function(to){
	var f = function(v){
		return num(v) && v <= to;
	};
	f.typename = "num.max(" + to + ")";
	return f;
}

num.min = function(from){
	var f = function(v){
		return num(v) && v >= from;
	};
	f.typename = "num.min(" + from + ")";
	return f;
}

array.bounded = function(spec, max){
	if(num(spec)){
		max = spec;
		spec = false;
	}
	
	var f = 
	function(v, typeDef){
		return array(v) && v.length <= max && (!spec || sh.validateType(v, spec));
	};
	f.typename = "array.bounded(" + max + ")";
	return f;
}