var localDebug = true;

$(function(){
	var twitter_api_url;
	if(localDebug){
		twitter_api_url = 'http://localhost:1337/';
	}else{
		twitter_api_url = 'http://api.twitter.com/1/statuses/user_timeline.json';	
	} 
	var twitter_user = 'jquery';
	var url = twitter_api_url + '?callback=?&screen_name=' + twitter_user;

	var templates = {
		tweet: null
	} 
	var tmplTweetSource   = $("#tweet_tmpl").html();
	templates.tweet = Handlebars.compile(tmplTweetSource);
	
	$.getJSON(url, function(data) {
		console.time("render tweets");
	    $.each(data, function(i, tweet) {
	        if (tweet.text !== undefined) {
	            var date_tweet = new Date(tweet.created_at);
	            var date_now = new Date();
	            var date_diff = date_now - date_tweet;
	            var hours = Math.round(date_diff / (1000 * 60 * 60));
	            var viewModel = {
	            		text: tweet.text,
	            		hours: hours,
	            		id: tweet.id,
	            		user: twitter_user
	            }
				var tweet_html = templates.tweet(viewModel)
	            $('#tweet_container').append(tweet_html);
	        }
	    });
		console.timeEnd("render tweets");
	});
});