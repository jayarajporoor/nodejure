/**
 @auth "local"
 @path "/login"
 @success "/home"
 @failure "/index.html"
*/

exports.auth = function(req, done, err,ctx){
	if(ctx.config.app && 
		ctx.config.app.samplePass !== "" &&
	   req.username == ctx.config.app.sampleUser && 
	   req.password == ctx.config.app.samplePass){
		done({id: 1, username: "sample-user", roles: ["user"]});
	}else{
		err.app("Invalid authentication attempt: " + req.username);
	}
}

/**
  @ignore
  @auth "nest"
  @method "get"
  @pathPrefix "/auth"
  @success "/home"
*/
exports.nestAuth  = function(req, ctx){
	console.log("NEST access token: ", req.user.accessTokens);
	sh.stream.addTransport("nest", req.user.id, 	
	{token: req.user.accessTokens.nest});	
}


/**
  @ignore
  @auth 	  "google"
  @pathPrefix "/login"
  @success     "/home"
*/
exports.googleAuth  = function(req, done, err, ctx){
	if(req.profile.emails && req.profile.emails.length > 0){
		done({username: req.profile.emails[0].value, 
				fullname: req.profile.displayName, roles:["guest"]});
	}else{
		err("Email not available.");
	}
}

/**
  @ignore
  @auth 	  "facebook"
  @pathPrefix "/login"
  @success     "/home"
*/
exports.facebookAuth  = function(req, done, err, ctx){
	if(req.profile){
		done({username: req.profile.username + "@facebook.com" , 
				fullname: req.profile.displayName, roles:["guest"]});
	}else{
		err("Email not available.");
	}
}

/**
 @auth  "api"
*/
exports.apiAuth = function(req, done, err, ctx){
	var apiKeys = ctx.config.app && ctx.config.app.apiKeys;
	if(apiKeys && apiKeys.contains(req.body.apiKey) && 
				  req.body.apiSecret ==  apiKeys[req.body.apiKey]){
		done({id: req.body.apiKey});
	}else{	
		err("Unauthenticated API access");
	}
}