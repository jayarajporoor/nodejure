
module.exports = function(ctx, done){
	//access the application config via ctx.config.
	//store any objects required for later access by route handlers in the ctx object.
	console.log("Application init called.");
	done();
}