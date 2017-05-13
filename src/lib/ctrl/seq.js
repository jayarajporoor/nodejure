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
 
 module.exports = function(name, options, parentDomain){
	return new Seq(name, options, parentDomain);
 }
 
 function Seq(name, options, parentDomain){
 	ctrlBase.CtrlBase.call(this, name, options, parentDomain); 
	this.prev = {};
	this.stepParams =null;
	if(options && options.checkError === false){
		this.checkError = false;
	}else{
		this.checkError = true;
	}
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
	this.lastStep = s;
	this.stepsExecuted.push(s);
	assert(s);
	this.executeStep(s);
 }
 
 Seq.prototype.nextImpl = function(params){
	var seq = this;
	this.stepParams = params;
	var proceed = true;
	if(this.checkError){
		if(params.length > 0 && this.errorHandler && params[0]){
			this.errorHandler(params[0]);
			this.finalize(params[0]);
			proceed = false;
		}
		this.stepParams = params.slice(1);//omit the error param.
	}
	
	if(proceed){
		process.nextTick(function(){
			seq.executeImpl();
		});
	}
 }
 
 Seq.prototype.executeStep = function(s){
	var seq = this;
 	if(utils.isFunction(s.stepFn)){
		var params = seq.stepParams;
		seq.stepParams = null;
		s.stepFn.apply(null, params);
	}else{
		var ctrl = s.stepFn;//this is a control block.
		ctrl.done(function(){
			process.nextTick(function(){
				seq.executeImpl();
			});
		});
		ctrl.execute();
	}
}

Seq.prototype.cancel = function(){
	this.finalize();
} 

Seq.prototype.repeatStep = function(){
	if(this.lastStep){
		this.stepsRemaining.unshift(this.lastStep);
	}
	this.lastStep = null;
}

function nop(){
}

