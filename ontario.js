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
    else { return Number(string.replace(/[^\d]/g, "")) }
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
        $(".positive-new").text(Number((todaysData["Confirmed Positive"]) - Number(yesterdaysData["Confirmed Positive"])).toLocaleString());
        $("#resolved").text(fmt(todaysData["Resolved"]));
        $(".resolved-new").text(Number((todaysData["Resolved"]) - Number(yesterdaysData["Resolved"])).toLocaleString());

        let deaths = Number(todaysData["Deaths"])
        $("#deaths").text(fmt(deaths));

        let deaths_delta = deaths - Number(yesterdaysData["Deaths"]);
        $(".deaths-new").text(deaths_delta.toLocaleString());

        let prev_deaths_delta = Number(yesterdaysData["Deaths"]) - Number(twoDaysAgoData["Deaths"]);
        $(".deaths-delta").text((deaths_delta - prev_deaths_delta).toLocaleString());

        let cases = Number(todaysData["Total Cases"]);
        $("#cases").text(fmt(cases));

        let cases_delta = (cases - Number(yesterdaysData["Total Cases"]));
        $(".cases-new").text(cases_delta.toLocaleString());

        let prev_cases_delta = (Number(yesterdaysData["Total Cases"]) - Number(twoDaysAgoData["Total Cases"]));
        $(".cases-delta").text((cases_delta - prev_cases_delta).toLocaleString());

        $("#testable").text(fmt(todaysData["Total patients approved for testing as of Reporting Date"]));

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

        let icu = Number(todaysData["Number of patients in ICU due to COVID-19"]);
        let icu_delta = Number(yesterdaysData["Number of patients in ICU due to COVID-19"]);
        $("#icu").text(fmt(icu));
        $(".icu-delta").text(fmt((icu - icu_delta)));

        let vent = Number(todaysData["Number of patients in ICU on a ventilator due to COVID-19"]);
        let vent_delta = Number(yesterdaysData["Number of patients in ICU on a ventilator due to COVID-19"]);
        $("#ventilator").text(fmt(vent));
        $(".ventilator-delta").text(fmt(vent - vent_delta));

        $("#ltcCases").text(fmt(todaysData["Total Positive LTC Resident Cases"]));
        $("#ltcHcwCases").text(fmt(todaysData["Total Positive LTC HCW Cases"]));
        $("#ltcDeaths").text(fmt(todaysData["Total LTC Resident Deaths"]));
        $("#ltcHcwDeaths").text(fmt(todaysData["Total LTC HCW Deaths"]));

        $(".delta").each(function () {
            $(this).addClass(function () { let x = Number(this.innerText.replace(",", "")) > 0 ? "positive" : "negative"; return x });
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
                let partial_total = (Number(todaysData["total_doses_administered"]) - (Number(todaysData["total_individuals_fully_vaccinated"]) * 2));
                $("#partially-vaccinated").text(partial_total.toLocaleString());
                let daily_final = (Number(todaysData["total_individuals_fully_vaccinated"]) - Number(yesterdaysData["total_individuals_fully_vaccinated"]));
                $("#daily-final").text(daily_final.toLocaleString());
                let daily_partial = (Number(todaysData["previous_day_doses_administered"]) - Number(daily_final));
                $("#daily-partial").text(daily_partial.toLocaleString());

            },
            complete: function () {

                if (casesInfoDate != vaccineInfoDate) {
                    $("#subtitle").html(`Case data last updated ${casesInfoDate}<br>Vaccine data not available. Similar to their handling of the pandemic, Ontario keeps changing the way this data is sent and breaks this site from time to time. We're working on it now...`);

                    // $("#subtitle").html(`Case data last updated ${casesInfoDate}<br>Vaccine data last updated ${vaccineInfoDate}`);
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