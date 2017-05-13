exports.req = 
{
	body:
	{
	}
}

exports.res = {
	contentType: "json",
	body:
	{
		name: str.safe,
		info: optional(str.safe)
	}	
}