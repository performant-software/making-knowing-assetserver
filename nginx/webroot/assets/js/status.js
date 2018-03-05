$.ajaxSetup ({
	// Disable caching of AJAX responses
	cache: false
});
$(document).ready(function() {
	$("#log").html("no log found");
	$("#status").html("Status: unknown");
	$("#start_date").html("");
	$("#end_date").html("");

	$.getJSON( "./import_status.json", function( data ) {
		$("#status").html("Status: "+data.progress);
		$("#start_date").html(data.start);
		$("#end_date").html(data.end);
		$.get( data.logfile, function( data ) {
			$("#log").html(data);
		});
		$('#log_link').html("[<a href='"+data.logfile+"'>download log</a>]");
		$('#browse_link').html("[<a href='browse.html'>browse</a>]");
	});

});
