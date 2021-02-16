    // Add comma separators to numeric string, or return the string itself if it cant be parsed (already has commas)
    function fmt(string) {
        let x = Number(string);
        if (!isNaN(x)) {
            return x.toLocaleString()
        }
        else { return string }
    }


    // Case data
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

            let length = data.result.records.length;
            let todaysData = data.result.records[length - 1];
            let yesterdaysData = data.result.records[length - 2];

            $("#title").append(todaysData["Reported Date"].replace(/(\d{4}-\d{2}-\d{2}).*/, "$1"));
            $("#positive").text(fmt(todaysData["Confirmed Positive"]));
            $(".positive-inc").text(Number((todaysData["Confirmed Positive"]) - Number(yesterdaysData["Confirmed Positive"])).toLocaleString());
            $("#resolved").text(fmt(todaysData["Resolved"]));
            $(".resolved-inc").text(Number((todaysData["Resolved"]) - Number(yesterdaysData["Resolved"])).toLocaleString());
            $("#deaths").text(fmt(todaysData["Deaths"]));
            $(".deaths-inc").text(Number((todaysData["Deaths"]) - Number(yesterdaysData["Deaths"])).toLocaleString());
            $("#cases").text(fmt(todaysData["Total Cases"]));
            $(".cases-inc").text((Number(todaysData["Total Cases"]) - Number(yesterdaysData["Total Cases"])).toLocaleString());
            $("#testable").text(fmt(todaysData["Total patients approved for testing as of Reporting Date"]));
            $("#tests").text(fmt(todaysData["Total tests completed in the last day"]));
            $("#percent").text(fmt(todaysData["Percent positive tests in last day"]) + "%");
            $("#hospital").text(fmt(todaysData["Number of patients hospitalized with COVID-19"]));
            $("#icu").text(fmt(todaysData["Number of patients in ICU with COVID-19"]));
            $("#ventilator").text(fmt(todaysData["Number of patients in ICU on a ventilator with COVID-19"]));
            $("#ltcCases").text(fmt(todaysData["Total Positive LTC Resident Cases"]));
            $("#ltcHcwCases").text(fmt(todaysData["Total Positive LTC HCW Cases"]));
            $("#ltcDeaths").text(fmt(todaysData["Total LTC Resident Deaths"]));
            $("#ltcHcwDeaths").text(fmt(todaysData["Total LTC HCW Deaths"]));
            $(".delta").each(function () {
                $(this).addClass(function () { let x = Number(this.innerText.replace(",", "")) > 0 ? "positive" : "negative"; return x });
                if ($(this).hasClass("positive")) { $(this).prepend("+") }
            });


        }
    });

    // Vaccine data
    $.ajax({
        type: 'POST',
        url: 'https://data.ontario.ca/en/api/3/action/datastore_search',
        cache: true,
        data: {
            resource_id: '8a89caa9-511c-4568-af89-7f2174b4378c', // Vaccines
            limit: 32000
        },
        dataType: "jsonp",
        success: function (data) {

            let length = data.result.records.length;
            let todaysData = data.result.records[length - 1];
            let yesterdaysData = data.result.records[length - 2];

            let terms = ["previous_day_doses_administered", "total_doses_administered", "total_individuals_fully_vaccinated"];
            terms.forEach((term) => {
                todaysData[term] = todaysData[term].replace(",", "");
                yesterdaysData[term] = yesterdaysData[term].replace(",", "");
            });

            $("#daily-doses").text(fmt(todaysData["previous_day_doses_administered"]));
            $("#total-doses").text(fmt(todaysData["total_doses_administered"]));
            $("#total-vaccinated").text(fmt(todaysData["total_individuals_fully_vaccinated"]));
            let partial_total = (Number(todaysData["total_doses_administered"]) - Number(todaysData["total_individuals_fully_vaccinated"]));
            $("#partially-vaccinated").text(partial_total.toLocaleString());
            let daily_final = (Number(todaysData["total_individuals_fully_vaccinated"]) - Number(yesterdaysData["total_individuals_fully_vaccinated"]));
            $("#daily-final").text(daily_final.toLocaleString());
            let daily_partial = (Number(todaysData["previous_day_doses_administered"]) - Number(daily_final));
            $("#daily-partial").text(daily_partial.toLocaleString());

        }
    });

    // Buys a moment for the API call to complete and also looks nice
    $("main").fadeIn();