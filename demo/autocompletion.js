// Adds a symbol to the query defining what should be recommended
var formatQueryForAutocompletion = function(partialToken, query) {
     var cur = yasqe.getCursor(false);
     var begin = yasqe.getRange({line: 0, ch:0}, cur);
     query = begin + "< " + query.substring(begin.length, query.length);
     return query;
};

/**
 * Autocompletion function
 */
var customAutocompletionFunction = function(partialToken, callback) {
    autocompletion.RecommendationQuery(formatQueryForAutocompletion(partialToken, yasqe.getValue()), function(q, type, err) {
        if (err) {
            alert(err)
            return
        }
        if (!q) {
            alert("No recommendation at this position")
            return
        }
        var ajaxConfig = {
            type: "GET",
            crossDomain: true,
            url: sparqled.config.endpoint,
            data: {
                format: 'application/json',
                query: q
            },
            success: function(data) {
                // Get the list of recommended terms
                var completions = [];
                for (var i = 0; i < data.results.bindings.length; i++) {
                    var binding = data.results.bindings[i];
                    var pof = binding.POF.value
                    if (type === autocompletion.PATH) {
                        // The YASQE library automatically wraps the string with '<' and '>'
                        completions.push(pof.substring(1, pof.length - 1));
                    } else {
                        completions.push(pof);
                    }
                }
                callback(completions);
            },
            beforeSend: function(){
                $('#loading').show();
            },
            complete: function(){
                $('#loading').hide();
            }
        };
        $.ajax(ajaxConfig);
    })
};

/*
 * Plug the recommendation to the YASQE editor
 */

YASQE.registerAutocompleter("sparqled", function() {
    return {
        async : true,
        bulk : false,
        isValidCompletionPosition : function() { return true;  },
        get : customAutocompletionFunction,
        preProcessToken: function(token) {return YASQE.Autocompleters.properties.preProcessToken(yasqe, token)},
        postProcessToken: function(token, suggestedString) {return YASQE.Autocompleters.properties.postProcessToken(yasqe, token, suggestedString)}
    };
});
YASQE.defaults.autocompleters = ["prefixes", "variables", "sparqled"];

var yasqe = YASQE(document.getElementById("yasqe"), {
	sparql: {
        endpoint: sparqled.config.endpoint,
		showQueryButton: true
	},
});
yasqe.showCompletionNotification("sparqled")
var yasr = YASR(document.getElementById("yasr"), {
	getUsedPrefixes: yasqe.getPrefixesFromQuery
});

/**
* Set some of the hooks to link YASR and YASQE
*/
yasqe.options.sparql.handlers.success =  function(data, status, response) {
	yasr.setResponse({response: data, contentType: response.getResponseHeader("Content-Type")});
};
yasqe.options.sparql.handlers.error = function(xhr, textStatus, errorThrown) {
	yasr.setResponse({exception: textStatus + ": " + errorThrown});
};

