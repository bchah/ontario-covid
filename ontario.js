// Add comma separators to numeric string, or return the string itself if it cant be parsed (already has commas)
function fmt(string) {
    let x = Number(string);
    if (!isNaN(x)) {
        return x.toLocaleString()
    }
    else { return string }
}

function num(string) {
    let x = Number(string);
    if (!isNaN(x)) {
        return x.toLocaleString()
    }
    else { return Number(String(string).replace(/[^\d]/g, "")) }
}

// Global so they can be compared between functions
var vaccineInfoDate;
var casesInfoDate;

// GET CASE DATA
$.ajax({
    type: 'POST',
    url: 'https://data.ontario.ca/en/api/3/action/datastore_search',
    cache: true,
    data: {
        resource_id: 'ed270bb8-340b-41f9-a7c6-e8ef587e6d11',
        limit: 32000
    },
    dataType: "jsonp",
    success: function (data) {

        data = data.result.records;
        let todaysData = data[data.length - 1];
        let yesterdaysData = data[data.length - 2];
        let twoDaysAgoData = data[data.length - 3];

        casesInfoDate = todaysData["Reported Date"].replace(/(\d{4}-\d{2}-\d{2}).*/, "$1");

        $("#positive").text(fmt(todaysData["Confirmed Positive"]));
        $(".positive-new").text(num((todaysData["Confirmed Positive"]) - num(yesterdaysData["Confirmed Positive"])).toLocaleString());
        $("#resolved").text(fmt(todaysData["Resolved"]));
        $(".resolved-new").text(num((todaysData["Resolved"]) - num(yesterdaysData["Resolved"])).toLocaleString());

        let deaths = num(todaysData["Deaths"])
        $("#deaths").text(fmt(deaths));

        let deaths_delta = deaths - num(yesterdaysData["Deaths"]);
        $(".deaths-new").text(deaths_delta.toLocaleString());

        let prev_deaths_delta = num(yesterdaysData["Deaths"]) - num(twoDaysAgoData["Deaths"]);
        $(".deaths-delta").text((deaths_delta - prev_deaths_delta).toLocaleString());

        let cases = num(todaysData["Total Cases"]);
        $("#cases").text(fmt(cases));

        let cases_delta = (cases - num(yesterdaysData["Total Cases"]));
        $(".cases-new").text(cases_delta.toLocaleString());

        let prev_cases_delta = (num(yesterdaysData["Total Cases"]) - num(twoDaysAgoData["Total Cases"]));
        $(".cases-delta").text((cases_delta - prev_cases_delta).toLocaleString());

        $("#testable").text(fmt(todaysData["Total patients approved for testing as of Reporting Date"]));

        let tests_delta = num(todaysData["Total tests completed in the last day"]) - num(yesterdaysData["Total tests completed in the last day"]);
        $(".tests-delta").text(tests_delta.toLocaleString());

        $("#tests").text(fmt(todaysData["Total tests completed in the last day"]));
        $("#percent-positive").text(fmt(todaysData["Percent positive tests in last day"]) + "%");

        let fatality_rate = ((deaths / cases) * 100);
        $("#percent-fatal").text(fatality_rate.toFixed(2) + "%");


        let hospital = num(todaysData["Number of patients hospitalized with COVID-19"]);
        let hospital_delta = num(yesterdaysData["Number of patients hospitalized with COVID-19"]);
        $("#hospital").text(fmt(hospital));
        $(".hospital-delta").text(fmt((hospital - hospital_delta)));

        let icu = num(todaysData["Number of patients in ICU due to COVID-19"]);
        let icu_delta = num(yesterdaysData["Number of patients in ICU due to COVID-19"]);
        $("#icu").text(fmt(icu));
        $(".icu-delta").text(fmt((icu - icu_delta)));

        let vent = num(todaysData["Number of patients in ICU on a ventilator due to COVID-19"]);
        let vent_delta = num(yesterdaysData["Number of patients in ICU on a ventilator due to COVID-19"]);
        $("#ventilator").text(fmt(vent));
        $(".ventilator-delta").text(fmt(vent - vent_delta));

        $("#ltcCases").text(fmt(todaysData["Total Positive LTC Resident Cases"]));
        $("#ltcHcwCases").text(fmt(todaysData["Total Positive LTC HCW Cases"]));
        $("#ltcDeaths").text(fmt(todaysData["Total LTC Resident Deaths"]));
        $("#ltcHcwDeaths").text(fmt(todaysData["Total LTC HCW Deaths"]));

        $(".delta").each(function () {
            $(this).addClass(function () { let x = num(this.innerText) > 0 ? "positive" : "negative"; return x });
            if ($(this).hasClass("positive")) { $(this).prepend("+") }
        });

    },
    complete: function () {

        // GET VACCINE DATA
        $.ajax({
            type: 'POST',
            url: 'https://data.ontario.ca/en/api/3/action/datastore_search',
            cache: true,
            data: {
                resource_id: '8a89caa9-511c-4568-af89-7f2174b4378c',
                limit: 32000
            },
            dataType: "jsonp",
            success: function (data) {

                data = data.result.records;
                let todaysData = data[data.length - 1];
                let yesterdaysData = data[data.length - 2];

                let terms = ["previous_day_doses_administered", "total_doses_administered", "total_individuals_fully_vaccinated"];
                terms.forEach((term) => {
                    todaysData[term] = num(todaysData[term]);
                    yesterdaysData[term] = num(yesterdaysData[term]);
                });

                vaccineInfoDate = todaysData["report_date"].replace(/(\d{4}-\d{2}-\d{2}).*/, "$1");

                let daily_doses = todaysData["previous_day_doses_administered"];
                $("#daily-doses").text(fmt(daily_doses));
                $("#total-doses").text(fmt(todaysData["total_doses_administered"]));
                $("#total-vaccinated").text(fmt(todaysData["total_individuals_fully_vaccinated"]));
                let partial_total = (num(todaysData["total_doses_administered"]) - (num(todaysData["total_individuals_fully_vaccinated"]) * 2));
                $("#partially-vaccinated").text(partial_total.toLocaleString());
                let daily_final = (num(todaysData["total_individuals_fully_vaccinated"]) - num(yesterdaysData["total_individuals_fully_vaccinated"]));
                $("#daily-final").text(daily_final.toLocaleString());
                let daily_partial = (num(todaysData["previous_day_doses_administered"]) - num(daily_final));
                $("#daily-partial").text(daily_partial.toLocaleString());

            },
            complete: function () {

                if (casesInfoDate != vaccineInfoDate) {
                    $("#subtitle").html(`Case data last updated ${casesInfoDate}<br>Vaccine data last updated ${vaccineInfoDate}`);
                } else {
                    $("#subtitle").html(`Data last updated ${casesInfoDate}`);
                }

                var now = Date.now();
                $("#subtitle").append("<br>Last checked " + new Date(now).toLocaleString());

            }
        });

    }
});

// Buys a moment for the API call to complete and also looks nice
$("main").fadeIn();