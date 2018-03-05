$.ajaxSetup({
	// Disable caching of AJAX responses
	cache: false
});
$(document).ready(function() {
	$("#log").html("no log found");
	$("#status").html("Status: unknown");
	$("#start_date").html("");
	$("#end_date").html("");

	$.getJSON("http://159.65.186.2/folio/manifest.json", function(data) {
		$("#listing").html(data);
		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				var list_link = '<div class="link" onclick="showTranscript(\'' + key + '\')">' + key + '</a><br>';
				$("#listing").append(list_link);
			}
		}
	});
	window.currentTranscript = "";
	switchType('tc');
});

function showTranscript(id) {
	if (typeof id === 'undefined') {
		return;
	}
	window.currentTranscript = id;
	var url = "http://159.65.186.2/folio/" + id + "/" + window.type + "/index.html";
	console.log(url);
	$.get(url, function(data) {
		var titleLink = '<a target="_blank" href="'+url+'">'+url+'</a>';
		$("#page_title").empty().append(titleLink);
		$("#transcription").empty().append(data);
		$("#transcription").scrollTop(0);
	});
}

function switchType(type) {
	var types = ['tc', 'tcn', 'tl'];
	window.type = type;
	var content = "";
	for (var idx = 0; idx < types.length; idx++) {
		var thisType = types[idx];
		if (window.type === thisType) {
			content += "<span class='current'>[" + thisType + "]</span>";
		} else {
			content += "<span class='link' onclick=\'switchType(\"" + thisType + "\")\'>[" + thisType + "]</span>";
		}
	}

	$("#typeswitch").html(content);
	showTranscript(window.currentTranscript);
}
