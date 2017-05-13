/**
 @noauth
 @interface "/app-info"
*/
exports.index = function(req, res, ctx){
	res.send({name: ctx.app.packageJson.name});
}

