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
var ctrlBase = lib_require("ctrl/ctrl-base");
var utils = lib_require("utils");
 
 module.exports = function(name, options){
	return new Seq(name, options);
 }
 
 function Seq(name, options){
 	ctrlBase.CtrlBase.call(this, name, options); 
	this.prev = {};
 }
 
 Seq.prototype = Object.create(ctrlBase.CtrlBase.prototype);
 
 Seq.prototype.executeImpl = function(){
	var seq = this;
		
	if(seq.stepsRemaining.length == 0){
		if(seq.doRepeat){
			seq.doRepeat = false;
			seq.stepsRemaining = seq.stepBuf.slice();
			seq.stepsExecuted = [];
			process.nextTick(function(){
				seq.executeImpl();
			});
		}else{
			for(var i=0;i<seq.doneHandlers.length;i++){
				seq.doneHandlers[i].call(null);
			}
			seq.finalize();
		}
		return;
	}
	
	var s = this.stepsRemaining.shift();
	this.stepsExecuted.push(s);
	assert(s);
	this.executeStep(s);
 }
 
 Seq.prototype.executeStep = function(s){
	var seq = this;
 	if(utils.isFunction(s.stepFn)){
		var req = {};
		var res = {};
		req.res = res;
		res.req = req;
		req.prev = this.prev.req;
		req.route = function(){
			sh.sim.route(req, res);
		}
		req.skip = function(){
			if(req.hasSkipped){
				return;//already skipped
			}
			req.route = res.render = res.send = res.json = nop;
			req.hasSkipped = true;
			process.nextTick(function(){
				seq.executeImpl();
			});
		}
		req.repeat = function(){
			req.doRepeat = true;
		}
		
		res.end = res.json = res.send = function(obj){
			console.log("Got response for: " + req.url);
			if(s.successFn){
				s.successFn(req, res);
			}
			if(req.doRepeat){
				seq.stepsRemaining.unshift(s);
			}
			process.nextTick(function(){
				seq.executeImpl();
			});
			return res;
		}
		res.render = function(p1, p2, p3){
			if(s.successFn){
				s.successFn(req, res);
			}
			if(req.doRepeat){
				seq.stepsRemaining.unshift(s);
			}			
			process.nextTick(function(){
				seq.executeImpl();
			});	
			return res;
		}
		this.prev.req = req;	
		s.stepFn(req, res);
	}else{
		var ctrl = s.stepFn;
		ctrl.finally(function(err){
			if(!err){
				process.nextTick(function(){
					seq.executeImpl();
				});
			}else{
				seq.finalize();
				console.log("Terminating sequence: " + seq.name + " owing to errors in control block: "           + ctrl.name);
			}
		});
		ctrl.execute();
	}
}

Seq.prototype.cancel = function(){
	this.finalize();
} 

function nop(){
}