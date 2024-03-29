const debug = true;

if (window.location.ancestorOrigins[0] == "http://ontario.boldlygoingnowhere.org") {
    $("#domainWarning").show();
}

// Add comma separators to numeric string, or return the string itself if it cant be parsed (already has commas)
function fmt(string) {
    let x = Number(string);
    if (!isNaN(x)) {
        return x.toLocaleString()
    }
    else { return string }
}

function num(string) {
    if (!Number.isInteger(string)) {
        var x = Number(string);
    } else {
        var x = string;
    }
    if (!isNaN(x)) {
        return x;
    }
    else { return Number(string.replace(/[^\d]/g, "")) }
}

// Begin the countdown
var tick = 30;
var ready = false;
var timer = setInterval(function () {
    if (ready) {
        clearInterval(timer);
        return true;
    } else if (tick == 23) {
        $("#msg").text("The data.ontario.ca server is taking a while to respond... hang tight!")
    } else if (tick == 12) {
        $("#msg").html("They might be really busy or updating the data at the moment. Let's wait a <em>little bit</em> longer and see.");
    } else if (tick == 4) {
        $("#msg").text("Here, let's try sending the data request again and see what happens...");
    } else if (tick == 0) {
        window.location.reload();
    }

    tick--;

}, 1000);

// Global so they can be compared between functions
var vaccineInfoDate;
var casesInfoDate;

const casesStarted = new Date('02/06/2020');
const vaccinesStarted = new Date('12/24/2020');
const today = new Date();
const casesQueryOffsetMs = today.getTime() - casesStarted.getTime();
const casesQueryOffset = Math.ceil(casesQueryOffsetMs / (1000 * 3600 * 24)) - 20; // only get a few recent records (with some buffer for error or missing records)
const vaccineQueryOffsetMs = today.getTime() - vaccinesStarted.getTime();
const vaccineQueryOffset = Math.ceil(vaccineQueryOffsetMs / (1000 * 3600 * 24)) - 20;

// GET CASE DATA
$.ajax({
    type: 'POST',
    url: `https://data.ontario.ca/en/api/3/action/datastore_search?resource_id=ed270bb8-340b-41f9-a7c6-e8ef587e6d11&offset=${casesQueryOffset}&limit=5000`,
    cache: true,
    dataType: "jsonp",
    success: function (data) {

        data = data.result.records;

        let todaysData = data[data.length - 1];
        let yesterdaysData = data[data.length - 2];
        let twoDaysAgoData = data[data.length - 3];

        if (debug) {
            console.log("Full Case Data Received:");
            console.log(data);
            console.log("Today's Case Data:");
            console.log(todaysData);
            console.log("Yesterday's Case Data:");
            console.log(yesterdaysData);
            console.log("Two Days Ago's Case Data:");
            console.log(twoDaysAgoData);
        }

        casesInfoDate = todaysData["Reported Date"].replace(/(\d{4}-\d{2}-\d{2}).*/, "$1");
        casesYesterday = yesterdaysData["Reported Date"].replace(/(\d{4}-\d{2}-\d{2}).*/, "$1");

        $("#positive").text(fmt(todaysData["Confirmed Positive"]));
        $(".positive-new").text(Number((todaysData["Confirmed Positive"]) - Number(yesterdaysData["Confirmed Positive"])).toLocaleString());
        $("#resolved").text(fmt(todaysData["Resolved"]));
        $(".resolved-new").text(Number((todaysData["Resolved"]) - Number(yesterdaysData["Resolved"])).toLocaleString());

        let deaths = Number(todaysData["Deaths_New_Methodology"])
        $("#deaths").text(fmt(deaths));

        let deaths_delta = deaths - Number(yesterdaysData["Deaths_New_Methodology"]);
        $(".deaths-new").text(deaths_delta.toLocaleString());

        let prev_deaths_delta = Number(yesterdaysData["Deaths_New_Methodology"]) - Number(twoDaysAgoData["Deaths_New_Methodology"]);
        $(".deaths-delta").text((deaths_delta - prev_deaths_delta).toLocaleString());

        let deaths_catchup = num(todaysData["deaths_data_cleaning"]);
        if (deaths_catchup > 0) {
            $("#deaths-catchup").html(`<small>(${deaths_catchup} of these deaths were previously unreported)</small>`).show();
        }

        let cases = Number(todaysData["Total Cases"]);
        $("#cases").text(fmt(cases));

        let cases_delta = (cases - Number(yesterdaysData["Total Cases"]));
        $(".cases-new").text(cases_delta.toLocaleString());

        let prev_cases_delta = (Number(yesterdaysData["Total Cases"]) - Number(twoDaysAgoData["Total Cases"]));
        let pcd_percent = Math.floor((cases_delta - prev_cases_delta) / cases_delta * 100);

        let changeInCases = (cases_delta - prev_cases_delta).toLocaleString();

        if (pcd_percent > 0) {
            $(".cases-delta").removeClass("negative");
            $(".cases-delta").addClass("positive");
            changeInCases = `+${changeInCases}`;
        } else {
            $(".cases-delta").removeClass("positive");
            $(".cases-delta").addClass("negative");
        }

        $(".cases-delta").html(changeInCases + ` <small>or</small> ${pcd_percent}%`);

        let population = todaysData["Total patients approved for testing as of Reporting Date"];
        $("#testable").text(fmt(population));

        let tests_delta = Number(todaysData["Total tests completed in the last day"]) - Number(yesterdaysData["Total tests completed in the last day"]);
        $(".tests-delta").text(tests_delta.toLocaleString());

        $("#tests").text(fmt(todaysData["Total tests completed in the last day"]));
        $("#percent-positive").text(fmt(todaysData["Percent positive tests in last day"]) + "%");

        let fatality_rate = ((deaths / cases) * 100);
        $("#percent-fatal").text(fatality_rate.toFixed(2) + "%");


        let hospital = Number(todaysData["Number of patients hospitalized with COVID-19"]);
        let hospital_delta = Number(yesterdaysData["Number of patients hospitalized with COVID-19"]);
        $("#hospital").text(fmt(hospital));
        $(".hospital-delta").text(fmt((hospital - hospital_delta)));

        if (!todaysData["Number of patients in ICU due to COVID-19"]) {
            $("#icu").text("No Data");
            $(".icu-delta").text("N/A");
        } else {
            let icu = Number(todaysData["Number of patients in ICU due to COVID-19"]);
            let icu_delta = Number(yesterdaysData["Number of patients in ICU due to COVID-19"]);
            $("#icu").text(fmt(icu));
            $(".icu-delta").text(fmt((icu - icu_delta)));
        }

        if (!todaysData["Number of patients in ICU on a ventilator due to COVID-19"]) {
            $("#ventilator").text("No Data");
            $(".ventilator-delta").text("N/A");
        } else {
            let vent = Number(todaysData["Number of patients in ICU on a ventilator due to COVID-19"]);
            let vent_delta = Number(yesterdaysData["Number of patients in ICU on a ventilator due to COVID-19"]);
            $("#ventilator").text(fmt(vent));
            $(".ventilator-delta").text(fmt(vent - vent_delta));
        }

        // $("#ltcCases").text(fmt(todaysData["Total Positive LTC Resident Cases"]));
        // $("#ltcHcwCases").text(fmt(todaysData["Total Positive LTC HCW Cases"]));
        // $("#ltcDeaths").text(fmt(todaysData["Total LTC Resident Deaths"]));
        // $("#ltcHcwDeaths").text(fmt(todaysData["Total LTC HCW Deaths"]));

        $(".delta").each(function () {
            if ($(this).hasClass("cases-delta")) { return true }
            $(this).addClass(function () { let x = Number(this.innerText.replace(",", "")) > 0 ? "positive" : "negative"; return x });
            if ($(this).hasClass("positive")) { $(this).prepend("+") }
        });

        // GET VACCINE DATA (NO LONGER PROVIDED AS OF MAY 2022)
        // $.ajax({
        //     type: 'POST',
        //     url: `https://data.ontario.ca/en/api/3/action/datastore_search?resource_id=8a89caa9-511c-4568-af89-7f2174b4378c&offset=${vaccineQueryOffset}&limit=5000`,
        //     cache: true,
        //     dataType: "jsonp",
        //     success: function (data) {

        //         data = data.result.records;
        //         let todaysData = data[data.length - 1];
        //         let yesterdaysData = data[data.length - 2];

        //         if (debug) {
        //             console.log("Full Vaccine Data Received:");
        //             console.log(data);
        //             console.log("Today's Vaccine Data:");
        //             console.log(todaysData);
        //             console.log("Yesterday's Vaccine Data:");
        //             console.log(yesterdaysData);
        //         }

        //         let terms = ["previous_day_total_doses_administered", "total_doses_administered", "total_individuals_fully_vaccinated"];
        //         terms.forEach((term) => {
        //             todaysData[term] = num(todaysData[term]);
        //             yesterdaysData[term] = num(yesterdaysData[term]);
        //         });

        //         // Vaccine dates are marked as of 00:00 on the following day, where cases were for that (prior) day
        //         vaccineInfoDate = yesterdaysData["report_date"].replace(/(\d{4}-\d{2}-\d{2}).*/, "$1");

        //         let totalDoses = num(todaysData["total_doses_administered"]);
        //         let singleVaxxed = num(todaysData["total_individuals_partially_vaccinated"]);
        //         let doubleVaxxed = num(todaysData["total_individuals_fully_vaccinated"]);
        //         let tripleVaxxed = num(todaysData["total_individuals_3doses"]);
        //         let quadVaxxed = totalDoses - (tripleVaxxed * 3) - ((doubleVaxxed - tripleVaxxed)*2) - singleVaxxed;
        //         // let totalDoses_y = num(yesterdaysData["total_doses_administered"]);
        //         // let singleVaxxed_y = num(yesterdaysData["total_individuals_partially_vaccinated"]);
        //         // let doubleVaxxed_y = num(yesterdaysData["total_individuals_fully_vaccinated"]);
        //         // let tripleVaxxed_y = num(yesterdaysData["total_individuals_3doses"]);

        //         let daily_doses = todaysData["previous_day_total_doses_administered"];
        //         $("#daily-doses").text(fmt(daily_doses));
        //         $("#total-doses").text(fmt(totalDoses));
        //         $("#total-vaccinated").text(fmt(doubleVaxxed));
        //         $("#triple-vaxxed").text(fmt(tripleVaxxed));
        //         $("#quad-vaxxed").text(fmt(quadVaxxed));
        //         $("#unvaccinated").text(fmt(population - quadVaxxed - tripleVaxxed - doubleVaxxed - singleVaxxed));

        //         let partial_total = (Number(todaysData["total_doses_administered"]) - (Number(todaysData["total_individuals_fully_vaccinated"]) * 2));
        //         $("#partially-vaccinated").text(partial_total.toLocaleString());

        //         // let daily_third = tripleVaxxed - tripleVaxxed_y;
        //         let daily_third = num(todaysData["previous_day_3doses"]);
        //         $("#daily-third").text(daily_third.toLocaleString());
        //         // let daily_second = doubleVaxxed - doubleVaxxed_y;
        //         let daily_second = num(todaysData["previous_day_fully_vaccinated"]);
        //         $("#daily-second").text(daily_second.toLocaleString());
        //         // let daily_first = singleVaxxed - singleVaxxed_y;
        //         let daily_first = num(todaysData["previous_day_at_least_one"]);
        //         $("#daily-first").text(daily_first.toLocaleString());
        //         let daily_fourth = daily_doses - daily_third - daily_second - daily_first;
        //         $("#daily-fourth").text(daily_fourth.toLocaleString());

        //     },
        //     complete: function () {

        //         if (casesInfoDate != vaccineInfoDate) {
        //             $("#checked").html(`Case and vaccine data come from separate data sources which are not updated at the same time:<br>
        //     Case data is up to 11:59pm on ${casesInfoDate}<br>Vaccine data is up to 12AM on ${vaccineInfoDate}<br>`);
        //         }

        //     }
        // });


        let now = new Date(Date.now()).toLocaleString();
        $("#checked").html("Last checked " + now + "<br>Latest data published on " + casesInfoDate);
        $("#today").text(casesInfoDate);
        $("#yesterday").text(casesYesterday);
        $("#openingMessage").hide();
        $("#theGoods").fadeIn();
        ready = true;

    },
    error: function (err) { clearInterval(timer); $(".spinner").remove(); $("#msg").html("Sorry, but the data.ontario.ca server is not responding! Please <a href=''>try again</a> in a few minutes.") }
});

// Buys a moment for the API call to complete and also looks nice
$("main").fadeIn();