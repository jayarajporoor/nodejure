/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

module.exports = function(){
	return extInfo;
} 

var extInfo = 
{
	hooks:[{type: "preroute", handler: checkRoles, priority: sh.hookPriorities.authr, invokeIf: ["auth"]}]
};

function checkRoles(req, res, done){

	var annotations = req.route.annotations;
	var routeRoles = annotations.roles || ["user"];
	var userRoles = req.user ? req.user.roles : null;
	if(!userRoles){
		req.sh.errors.push("User does not have the necessary roles to access: " + 
						req.url + " User: " + JSON.stringify(req.user));
	}else{	
		routeRoles.some(function(v){
			if(userRoles.contains(v)){
				req.setFlag("authr");
				return true;
			}
		});
	}
	done();
}