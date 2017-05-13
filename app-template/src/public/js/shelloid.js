var $ = jQuery;
var JSON = JSON || {};

JSON.stringify = JSON.stringify || function (obj) {
	var t = typeof (obj);
	if (t != "object" || obj === null) {
		// simple data type
		if (t == "string") obj = '"' + obj + '"';
		return String(obj);
	}
	else {
		// recurse array or object
		var n, v, json = [], arr = (obj && obj.constructor == Array);
		for (n in obj) {
			v = obj[n];
			t = typeof(v);
			if (t == "string") v = '"' + v + '"';
			else if (t == "object" && v !== null) v = JSON.stringify(v);
			json.push((arr ? "" : '"' + n + '":') + String(v));
		}
		return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
	}
};

function showToast(msg) {
	//type: danger info success
	var options = {duration: 3000, sticky: false, type: "info"};
	$.toast(msg, options);
}

function doPost(url, params, successFn) {
	$.post(url, params, successFn)
	.fail(function (xhr, status, err) {
		showToast("Couldn't post the information to the server. Please try again.");
		console.log("ajax status: " + status + " err: " + err + " xhr.status: " + xhr.status);
	});
}

$(function () {
	doPost("/app-info", {}, function(appInfo){
		window.appInfo = appInfo;
		$(".appname").html(appInfo.name);
		window.title = appInfo.name;
	});
});

function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(location.search);
	return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}
