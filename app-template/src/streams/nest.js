/**
@stream.sdl select: ambient_temperature_f, name_long;
			from: nest.thermostat;
			where: ambient_temperature_f >= $threshold
@stream.init highTemperatureInit
*/
exports.highTemperature = function(data, streamInstance, user){
	console.log("highTemperature Data: ", data, " for user id ", user);
}

exports.highTemperatureInit = function(streamDef, done){
	streamDef.newInstance({$threshold:80}, "global");
	done();
}


