/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
var assert = require("assert");
var utils = lib_require("utils");

module.exports = function(){
	return extInfo;
} 

var extInfo = 
{
	annotations:[{name: "sql", process: processSql, raw: true}]
};

function addSqlMethods(annotations, db){
	var sql = annotations.sql;
	if(!sql) return;
	var keys = Object.keys(sql);
	for(var i=0;i<keys.length;i++){
		var sqlName = keys[i];
		var sqlString = sql[sqlName];
		if(sqlName != "query" && sqlName != "genericQuery"){
			db[sqlName] = queryFunction.bind(db, sqlString);
		}else{
			db.processError("Cannot use built in names query/genericQuery for query names");
		}
	}
}

function processSql(annotations, keyFields, value){
	assert(keyFields[0] == "sql");
	if(keyFields.length < 2){
		return true;
	}
	var sqlName = keyFields[1];
	var v = value.replace(/\s+/g, ' ');
	if(!annotations.sql){
		annotations.sql = {};
		annotations.$addHook({type: "db", handler: addSqlMethods});
	}
	annotations.sql[sqlName] = v;	
}

function queryFunction(sqlString, maybeFn){
	var db = this;
	var params = Array.prototype.slice.call(arguments);				
	if(utils.isFunction(maybeFn)){
		var genFn = function(){
			var queryParams = maybeFn();
			return [sqlString, queryParams];
		};
		params = [genFn];
	}
	var queryFn = db.query || db.genericQuery;
	return queryFn.apply(db, params);
}