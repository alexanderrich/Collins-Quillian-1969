/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

// All pages to be loaded
var pages = [
    "instructions/instruct-1.html",
    "instructions/instruct-2.html",
    "instructions/instruct-3.html",
    "instructions/instruct-ready.html",
    "stage.html",
    "postquestionnaire.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // add as a list as many pages as you like
    "instructions/instruct-1.html",
    // "instructions/instruct-2.html",
    // "instructions/instruct-3.html",
    "instructions/instruct-ready.html"
];

var stims;
d3.csv("static/stim.txt", function(data) {
    stims = data.map(function(d) {
        return {
            stimnum: +d.stimnum,
            truth: d.truth,
            type: d.type,
            level: +d.level,
            hierarchy: d.hierarchy,
            stimtext: d.stimtext
        };
    });
});
var trialnum = 0;
var endOfBreak = false;

/********************
 * HTML manipulation
 *
 * All HTML files in the templates directory are requested
 * from the server when the PsiTurk object is created above. We
 * need code to get those pages from the PsiTurk object and
 * insert them into the document.
 *
 ********************/




/********************
 * STROOP TEST       *
 ********************/
var StroopExperiment = function() {

    var wordon, // time word is presented
        listening = false;

    stims = _.shuffle(stims);

    var next = function() {
        if (stims.length===0) {
            finish();
        }
        else {
            d3.select("#prompt").html('Is this sentence true?')
            stim = stims.shift();
            trialnum += 1;
            show_word(stim.stimtext);
            wordon = new Date().getTime();
            listening = true;
            d3.select("#query").html('Type "F" for True, "J" for False.');
        }
    };

    var response_handler = function(e) {
        if (!listening) return;

        var keyCode = e.keyCode,
            response;

        switch (keyCode) {
        case 70:
            // "F"
            response="T";
            break;
        case 74:
            // "J"
            response="F";
            break;
        case 32:
            if (endOfBreak) {
                d3.select("#stim").html('');
                setTimeout(next, 2000);
            }
            break;
        default:
            response = "";
            break;
        }
        if (response.length>0) {
            listening = false;
            stim.hit = response === stim.truth;
            stim.rt = new Date().getTime() - wordon;
            stim.trialnum = trialnum;
            stim.uniqueid = uniqueId;
            finish_stim();
        }
    };

    var finish_stim = function () {
        d3.select("#stim")
            .style("opacity", 0);
        if (typeof stim.rt === "undefined") {
            listening = false;
            stim.rt = -1;
            stim.hit = null;
            stim.trialnum = trialnum;
            stim.uniqueid = uniqueId;
        }
        psiTurk.recordTrialData(stim);
        if (trialnum % 10 === 0) {
            d3.select("#prompt").html('');
            d3.select("#stim").html('REST (30 seconds)')
                .style("opacity", 1);
            d3.select("#query").html('');
            setTimeout(function () {
                d3.select("#stim").html('Press SPACE to continue');
                listening = true;
                endOfBreak = true;

            }, 30000);
        }
        else {
            setTimeout(next, 2000);
        }
    };

    var finish = function() {
        $("body").unbind("keydown", response_handler); // Unbind keys
        currentview = new Questionnaire();
    };

    var show_word = function(text) {
        d3.select("#stim")
            .style("text-align","center")
            .style("opacity", 1)
            .style("font-size","40px")
            // .style("font-weight","400")
            .style("margin","20px")
            .text(text);
    };



    // Load the stage.html snippet into the body of the page
    psiTurk.showPage('stage.html');

    // Register the response handler that is defined above to handle any
    // key down events.
    $("body").focus().keydown(response_handler);

    // Start the test
    setTimeout(next, 2000);
};


/****************
 * Questionnaire *
 ****************/

var Questionnaire = function() {

    var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

    record_responses = function() {

        psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

        $('textarea').each( function(i, val) {
            psiTurk.recordUnstructuredData(this.id, this.value);
        });
        $('select').each( function(i, val) {
            psiTurk.recordUnstructuredData(this.id, this.value);
        });

    };

    prompt_resubmit = function() {
        replaceBody(error_message);
        $("#resubmit").click(resubmit);
    };

    resubmit = function() {
        replaceBody("<h1>Trying to resubmit...</h1>");
        reprompt = setTimeout(prompt_resubmit, 10000);

        psiTurk.saveData({
            success: function() {
                clearInterval(reprompt);
                psiTurk.computeBonus('compute_bonus', function(){finish()});
            },
            error: prompt_resubmit
        });
    };

    // Load the questionnaire snippet
    psiTurk.showPage('postquestionnaire.html');
    psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});

    $("#next").click(function () {
        record_responses();
        psiTurk.saveData({
            success: function(){
                psiTurk.computeBonus('compute_bonus', function() {
                    psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                });
            },
            error: prompt_resubmit});
    });


};

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
        instructionPages, // a list of pages you want to display in sequence
        function() { currentview = new StroopExperiment(); } // what you want to do when you are done with instructions
    );
});
