/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
 
var stream = require('stream');

module.exports = function(){
	var liner = new stream.Transform( { objectMode: true } );
	 
	liner._transform = function (chunk, encoding, done) {
		 var data = chunk.toString();
		 if (this._lastLineData) data = this._lastLineData + data;
	 
		 var lines = data.split('\n');
		 this._lastLineData = lines.splice(lines.length-1,1)[0];
	 
		 lines.forEach(this.push.bind(this));
		 done();
	}
	 
	liner._flush = function (done) {
		 if (this._lastLineData) this.push(this._lastLineData);
		 this._lastLineData = null;
		 done();
	}
	return liner;
}

 
