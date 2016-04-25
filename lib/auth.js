var oauthSignature=require('oauth-signature');
var querystring=require('querystring');
var fs=require('fs');
var date=new Date;
NONCE_CHARS= ['a','b','c','d','e','f','g','h','i','j','k','l','m','n',
              'o','p','q','r','s','t','u','v','w','x','y','z','A','B',
              'C','D','E','F','G','H','I','J','K','L','M','N','O','P',
              'Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3',
              '4','5','6','7','8','9'];

function getNonce(nonceSize) {
   var result = [];
   var chars= NONCE_CHARS;
   var char_pos;
   var nonce_chars_length= chars.length;

   for (var i = 0; i < nonceSize; i++) {
       char_pos= Math.floor(Math.random() * nonce_chars_length);
       result[i]=  chars[char_pos];
   }
   return result.join('');
}
var getTimestamp= function() {
  return Math.floor( (new Date()).getTime() / 1000 );
}

module.exports=function AuthTwitt(path,method,oauth_param,dop_param,callback)
{
	var httpMethod=method;
	var url="https://api.twitter.com"+path;
	var parameters=
	{
		oauth_consumer_key:oauth_param.consumer_key,
		oauth_nonce: getNonce(36),
		oauth_signature_method:oauth_param.signature_method,
		oauth_timestamp: getTimestamp(),
		oauth_version:oauth_param.version,
	}
	for(param in dop_param)
		{
			parameters[param]=dop_param[param];
		}
	var encodedSignature = oauthSignature.generate(httpMethod, url, parameters, oauth_param.consumer_secret, oauth_param.token_secret);
	var signature = oauthSignature.generate(httpMethod, url, parameters, oauth_param.consumer_secret, oauth_param.token_secret,
		{ encodeSignature: true});
	parameters.oauth_signature=signature;
	
		var reqs='OAuth ';
		for(param in parameters)
		{
			reqs+=param+'=\"'+parameters[param]+'\", ';
			
		}
			
	var options = {
	  key: fs.readFileSync('lib/key.pem'),
	  hostname: 'api.twitter.com',
	  //hostname: '127.0.0.1',
	  //port:"85",
	  path: path,
	  method: method,
	  headers: 
			{
				//'Content-Type': 'application/x-www-form-urlencoded',
				Authorization:reqs
			}
	};
	callback(options);
}