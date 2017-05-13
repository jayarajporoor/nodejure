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

module.exports = function(){
	extInfo.services.stream.transportMods.nest = 
		path.normalize(path.join(__dirname, "transports/nest.js"));
	extInfo.services.stream.transportMods.nycTraffic = 
		path.normalize(path.join(__dirname, "transports/nyc-traffic.js"));		
	return extInfo;
} 

var extInfo = {
	services:{
		stream : {transportMods: {}}
	}
}