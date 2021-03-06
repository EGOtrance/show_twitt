var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var templating = require('consolidate');
var cook=require('cookie-parser');
var auth=require('./lib/auth');
var users={};
var request=require('request');
var data;
var http=require('https');
var querystring=require('querystring');
var fs=require('fs');

app.use(bodyParser.urlencoded({extended: true}));//для POST запросов
app.use(bodyParser.json());
app.use(cook());
app.engine('hbs', templating.handlebars);
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views'); 

var oauth={consumer_key:'Wx0ezY4Fp3FmuY7ZObfTXKFjA',
			consumer_secret:'xmf0gOATp6IyyEhKGZ0ac1GopUymLlBIoc3Mn7FAnHRkfYOyLV',
			signature_method:'HMAC-SHA1',
			version:'1.0'
			};
			
function user(userName,userPass,twittToken,twittTokenSecret,serverToken){
	this.userName=userName
	this.userPass=userPass;
	this.twittToken=twittToken;
	this.twittTokenSecret=twittTokenSecret;
	this.serverToken=new Date(Date.now() + 2 * 604800000);
}


var request = require('request');
var urlutils = require('url');
app.get('/', function(req, res){
	if (!req.cookies.usr)
	{
		res.render('search', {
		title: 'Авторизируйтесь',
		goust:'GOUST'
	})
	}
	else if (!req.cookies.usr.screenName)
	{
		res.clearCookie('usr',{path:'/'})
		res.render('search', {
		title: 'Авторизируйтесь',
		goust:'GOUST'
		})
	} 
	else 
	{
		res.render('search', {
		title: 'Введите твитт для поиска',
		user: req.cookies.usr.screenName
		});
	}
});
app.get('/enter_pin',function(req,res){
	res.render('pin', {
		title: 'Введите полученный PIN'
	});
})
app.get('/shutdown', function(req,res){
	res.clearCookie('usr',{path:'/'});
	res.render('search', {
		title: 'Авторизируйтесь',
		goust:'GOUST'
	})
})
app.get('/show',function(req,res){
			console.log('show:',req.cookies.usr);
			if (!req.cookies.usr)
			{
				res.render('auth');
			}
		else
		{
			var perm_data = req.query.text
			, oauthF =
        { consumer_key: oauth.consumer_key 
        , consumer_secret: oauth.consumer_secret
        , token: req.cookies.usr.twittToken
        , token_secret: req.cookies.usr.twittTokenSecret
        }
      , url = 'https://api.twitter.com/1.1/search/tweets.json'
      , qs =
        { q: perm_data,
			count:100
		}
			console.log('отправляю запрос '+req.query.text)
		request.get({url:url, oauth:oauthF, qs:qs, json:true}, function (e, r, data) {
			if (e) res.render('error',{error:"Нет связи с твиттер, повторите попытку позже"});
			else{
			if (data.errors)
			{
				res.clearCookie('usr',{path:'/'});
				res.render('auth',{error:'Токен устарел или неверен, авторизируйтесь еще раз'});
			}
			else{
				console.log('получил ответ на запрос '+req.query.text+' отправляю ответ клиенту');
				res.render('search',{title:'Найдено по запросу: '+req.query.text, twitt:data.statuses,
									  user: req.cookies.usr.screenName});
			}
			}})
		
			
		}
});
app.post('/auth', function(req,res) {
	if (users[req.body.user]==undefined)
	{
    auth('/oauth/request_token','POST',oauth,{'oauth_callback':'oob'}, function(options){
			var request = http.request(options, function(response) {
			var data='';
			response.on('error',function(){
				res.render('error',{error:"Ошибка приема данных, повторите попытку позже"});
			})
			response.on("data", function(chunk) {
					data+=chunk;
					});
			response.on("end",function()
					{   //проверить ошибки (если ответ пришел некорректный)
						//console.log(data);
						var usr=new user(req.body.user,req.body.pass,querystring.parse(data).oauth_token,querystring.parse(data).oauth_token_secret,new Date(Date.now() + 2 * 604800000));
						usr.auth=false;
						res.cookie('usr',usr,{path: '/'});
						res.writeHead(301,{Location: 'https://api.twitter.com/oauth/authorize?oauth_token='+querystring.parse(data).oauth_token});
						res.end();
						//users[req.body.user]=new user(req.body.pass,querystring.parse(token).oauth_token,querystring.parse(token).oauth_token_secret)
						
					})
			});
			request.on('error',function (){
				res.render('error',{error:"Нет связи с твиттер, повторите попытку позже"});
				});
			request.end();
		
	})
	}
	//twittAuth('/oauth/request_token','POST',consumer_key, consumer_secret, signature_method, version, "", "",{'oauth_callback':'oob'},authStep1,res);
	
})
app.post('/pin',function(req,res){
	 auth('/oauth/access_token','POST',oauth,{'oauth_token':req.cookies.usr.twittToken,'oauth_token_secret':req.cookies.usr.twittTokenSecret,'oauth_verifier':req.body.pin}, function(options){
			var request = http.request(options, function(response) {
			var data='';
			response.on('error',function(){
				res.render('error',{error:"Ошибка приема данных, повторите попытку позже"});
			})
			response.on("data", function(chunk) {
					data+=chunk;
					});
			response.on("end",function()
					{   //проверить ошибки
						if (!querystring.parse(data).oauth_token)
						{
							res.render('pin', {
							error: 'неправильно введен PIN повторите'
						     });
						}
						console.log('/pin'+data);
						var usr=new user(req.cookies.usr.userName,req.cookies.usr.userPass,querystring.parse(data).oauth_token,querystring.parse(data).oauth_token_secret,new Date(Date.now() + 2 * 604800000));
						usr.userId=querystring.parse(data).user_id;
						usr.screenName=querystring.parse(data).screen_name;
						usr.auth=true;
						res.cookie('usr',usr,{path: '/'});
						
						res.render('search', {
							title: 'Введите твитт для поиска',
							user: querystring.parse(data).screen_name
	});
						
						
					})
			});
			request.on('error',function (){
				res.render('error',{error:"Нет связи с твиттер, повторите попытку позже"});
				});
			request.end();
			
		
	})
})
app.listen(8080);
console.log('Express server listening on port 8080');
