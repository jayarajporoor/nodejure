module.exports = exec;

function exec(done){
	var seq = shelloid.sim.seq();
	var con = shelloid.sim.concur();
	
	seq
	.step(function(req, res){
	  req.body = {userid: 1, friendid: 2};
	  req.method = "post";
	  req.url = "/user/friend/add";  
	  //req.route();
	  seq.cancel();//req.skip() will skip the current step.
	  //req.repeat() will repeat the request 
	})
	.step(function(req, res){
	  req.body = {userid: 1};
	  req.method = "get"
	  req.url = "/user/friend/list";
	  req.route();
	})
	.success(function(req, res){
	   assert(res.body.friends.indexOf(req.prev.body.friendid) >= 0);
	})
	.finally(function(){
		console.log("Sequence 1 done");
	});
	
	var conc = sh.sim.concur();
	conc
	.step(function(req, res){
		req.url = "/test/test2";
		req.method = "get";
		req.route();
	})
	.success(function(req, res){
		console.log("Success on: " + req.url);
	})
	.step(function(req, res){
		req.url = "/test/test3";
		req.method = "get";
		req.route();
	})
	.success(function(req, res){
		console.log("Success on: " + req.url);
	})
	.error(function(err){
		console.log("Concur error");
	});
	
	var seq2 = sh.sim.seq();
	seq2
	.step(seq)
	.step(conc)
	.finally(function(){
		console.log("sequence 2 done");
		done();
	})
	.execute();		
}