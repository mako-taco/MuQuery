MuQuery
=======
Seems like the most useful things in jQuery are an easy selector and ajax functionality.

Here are those two things in a much smaller file.

You can type `µ` on OSX with alt + m, or just use `mu` instead.

###Selector
```js
var nodelist = µ("body .container.cool p");

for(var i=0; i<nodelist.length; i++) {
	nodelist[i].setAttribute("class", "awesome");
}
```

###AJAX
```js
µ.post("/house/123", {json: "data"}, function (err, result) {
	if(err) {
		console.error("Could not post, response code", err);
	}
	else {
		console.log("Response is", result);
	}
});

µ.get("/house/123", function (err, result) {
	if(err) {
		console.error("Could not get, response code", err);
	}
	else {
		console.log("Response is", result);
	}
})
```