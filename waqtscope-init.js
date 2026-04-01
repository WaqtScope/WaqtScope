/*
 * WaqtScope initialization - converted from PHP-generated JS in index.php
 * Handles cookie loading, event binding, and UI initialization.
 */

// Parameter definitions (previously PHP $params array)
var wsParams = {
    imsakM:     { setting: 'imsak',      hasInput: true,  deflt: '10 min' },
    fajrM:      { setting: 'fajr',       hasInput: true,  deflt: '18' },
    dhuhrA:     { setting: 'dhuhr',      hasInput: true,  deflt: '0 min' },
    asrJ:       { setting: 'asr',        hasInput: false, deflt: 'Standard' },
    maghribM:   { setting: 'maghrib',    hasInput: true,  deflt: '0 min' },
    ishaM:      { setting: 'isha',       hasInput: true,  deflt: '18' },
    midnightM:  { setting: 'midnight',   hasInput: false, deflt: 'Standard' },
    highLatM:   { setting: 'highLats',   hasInput: false, deflt: 'NightMiddle' },
    timeFormats:{ setting: 'timeformat', hasInput: false, deflt: '12hNS' }
};

// Create menu handler function for a given parameter
function createParamMenuFn(paramKey, param) {
    return function() {
        var newval = $('#' + paramKey + '-Select').val();
        if (param.hasInput) {
            var inputval = $('#' + paramKey + '-input').val();
            if (newval == "FixedTime") inputval = "" + inputval + " min";
            prayTimes.adjust(makeAdjustObj(param.setting, inputval));
            $.cookie(param.setting, inputval, { expires: 71 });
        } else {
            prayTimes.adjust(makeAdjustObj(param.setting, newval));
            $.cookie(param.setting, newval, { expires: 71 });
        }
    };
}

// Helper to create a dynamic-key object for prayTimes.adjust()
function makeAdjustObj(key, value) {
    var obj = {};
    obj[key] = value;
    return obj;
}

$(document).ready(function(){
    $("#NoJS").hide();
    jqEvents();

    var latit = (23 + 42/60);
    var longt = (90 + 22/60 + 30/3600);
    var elevn = 0;
    var coord = [latit, longt, elevn];

    // Load location cookies
    var tZone = $.cookie(_C.timeZone()) || 6;
    var timeZoneSelIndex = $.cookie(_C.timeSelected()) || 90;
    Info.cityId = $.cookie(_C.cityId()) || 832;
    Info.countryId = $.cookie(_C.countryID()) || 12;
    Info.manSetLLA = $.cookie(_C.manSetLLA()) || 832;
    Info.prevdays = $.cookie(_C.prevdays()) || 0;
    Info.nextdays = $.cookie(_C.nextdays()) || 30;

    // Load method cookies
    var calcMethod = $.cookie(_C.calcMethod()) || 'IFB';
    var calcMethodIndex = $.cookie(_C.calcMethodIndex()) || '7';

    // Apply method
    prayTimes.setMethod(calcMethod);

    // Load and apply per-param cookies
    for (var paramKey in wsParams) {
        if (!wsParams.hasOwnProperty(paramKey)) continue;
        var param = wsParams[paramKey];
        var paramvar = $.cookie(param.setting) || 'NOTSET';
        if (paramvar != 'NOTSET') {
            prayTimes.adjust(makeAdjustObj(param.setting, paramvar));
            if (param.hasInput) {
                $('#' + paramKey + '-input').val(prayTimes.eval(paramvar));
                paramvar = prayTimes.isMin(paramvar) ? 'FixedTime' : 'Angle';
            }
            $('#' + paramKey + '-Select').val(paramvar);
        }
    }

    // Apply location from cookies
    Info.timeZone = tZone;
    if (Info.cityId == '0') {
        latit = $('#Latitude-input').val();
        longt = $('#Longitude-input').val();
        elevn = $('#Altitude-input').val();
    } else {
        latit = LocData.City[Info.cityId][1];
        longt = LocData.City[Info.cityId][2];
        elevn = LocData.City[Info.cityId][3];
    }
    Info.setLatitude(latit);
    Info.setLongitude(longt);
    Info.setElevation(elevn);
    if (1 == Info.manSetLLA) {
        $("#manualInput").attr('checked', 'true');
    } else {
        $("#manualInput").attr('checked', 'false');
        $("#manualInput").removeAttr('checked');
    }

    var today = new Date();

    // Populate UI
    $('#contryMenu').html(genCountryOptions());
    $('#tZoneMenu').html(genTimeZoneOptions());
    document.locform.tZoneMenu.selectedIndex = timeZoneSelIndex;
    $('#contryMenu').val(Info.countryId);
    $('#CityMenu').html(genCityOptions(Info.countryId));
    $('#CityMenu').val(Info.cityId);
    $("#prevdays").val(Info.prevdays);
    $("#nextdays").val(Info.nextdays);
    $("#methodName").text(document.MethodF.CalcMethod.options[calcMethodIndex].title);
    document.MethodF.CalcMethod.options.selectedIndex = calcMethodIndex;

    updateWT();

    // CalcMethod change handler
    $('#CalcMethod').change(CalcMethodFn);
    $('#CalcMethod').click(CalcMethodFn);
    function CalcMethodFn(){
        var methodName = $('#CalcMethod').val();
        prayTimes.setMethod(methodName);
        var selected = document.MethodF.CalcMethod.selectedIndex;
        $("#methodName").text(document.MethodF.CalcMethod.options[selected].title);
        $.cookie(_C.calcMethod(), methodName, { expires: 71 });
        $.cookie(_C.calcMethodIndex(), selected, { expires: 71 });

        // Update form
        $("#asrJ-Select").val(prayTimes.getSetting().asr);
        $.cookie(_C.asrJ(), prayTimes.getSetting().asr, { expires: 71 });

        if (methodName == "Jafari" || methodName == "Tehran" || methodName == "IFB1") {
            $("#midnightM-Select").val("Jafari");
            $("#maghribM-Select").val("Angle");
        } else {
            $("#midnightM-Select").val("Standard");
            $("#maghribM-Select").val("FixedTime");
        }
        $("#maghribM-input").val(prayTimes.eval(prayTimes.getSetting().maghrib));

        if (methodName == "Makkah") { $("#ishaM-Select").val("FixedTime"); }
        else $("#ishaM-Select").val("Angle");
        $("#ishaM-input").val(prayTimes.eval(prayTimes.getSetting().isha));

        $("#fajrM-input").val(prayTimes.getSetting().fajr);
        $("#dhuhrA-input").val(prayTimes.eval(prayTimes.getSetting().dhuhr));

        if (prayTimes.isMin(prayTimes.getSetting().imsak)) $("#imsakM-Select").val("FixedTime");
        else $("#imsakM-Select").val("Angle");
        $("#imsakM-input").val(prayTimes.eval(prayTimes.getSetting().imsak));

        $("#highLatM-Select").val(prayTimes.getSetting().highLats);
        $("#timeFormats-Select").val(prayTimes.getSetting().timeformat);

        // Call all param menu functions
        for (var pk in paramMenuFns) {
            if (paramMenuFns.hasOwnProperty(pk)) paramMenuFns[pk]();
        }
    }

    // Default button
    $('#DefaultBtn').click(function(){
        for (var paramKey in wsParams) {
            if (!wsParams.hasOwnProperty(paramKey)) continue;
            var param = wsParams[paramKey];
            $.cookie(param.setting, param.deflt);
            prayTimes.adjust(makeAdjustObj(param.setting, param.deflt));
        }
        CalcMethodFn();
    });

    // Country menu
    $('#contryMenu').change(ContryMenuFn);
    function ContryMenuFn(){
        var contry = $('#contryMenu').val();
        Info.countryId = contry;
        $('#CityMenu').html(genCityOptions(contry));
        $.cookie(_C.countryID(), Info.countryId, { expires: 71 });
    }

    // City menu
    $('#CityMenu').change(CityMenuFn);
    $('#CityMenu').click(CityMenuFn);
    function CityMenuFn(){
        var city = $('#CityMenu').val();
        Info.cityId = city;
        if (city == 0) {
            Info.setLatitude($('#Latitude-input').val());
            Info.setLongitude($('#Longitude-input').val());
            Info.setElevation($('#Altitude-input').val());
        } else {
            Info.setLatitude(1 * LocData.City[city][1]);
            Info.setLongitude(1 * LocData.City[city][2]);
            Info.setElevation(1 * LocData.City[city][3]);
        }
        $('#Latitude-input').val(Info.latitude().toFixed(3));
        $('#Longitude-input').val(Info.longitude().toFixed(3));
        $('#Altitude-input').val(Info.elevation());
        $.cookie(_C.cityId(), Info.cityId, { expires: 71 });
        updateWT();
    }

    // Timezone menu
    $('#tZoneMenu').change(tZoneMenuFn);
    function tZoneMenuFn(){
        var tZone = $('#tZoneMenu').val();
        var selected = document.locform.tZoneMenu.selectedIndex;
        var tZoneName = (document.locform.tZoneMenu.options[selected].title);
        Info.timeZone = tZone;
        $.cookie(_C.timeZone(), tZone, { expires: 71 });
        $.cookie(_C.timeSelected(), selected, { expires: 71 });
        $.cookie(_C.timeZoneName(), tZoneName, { expires: 71 });
        updateWT();
    }

    // Create and bind param menu functions
    var paramMenuFns = {};
    for (var paramKey in wsParams) {
        if (!wsParams.hasOwnProperty(paramKey)) continue;
        var param = wsParams[paramKey];
        var fn = createParamMenuFn(paramKey, param);
        paramMenuFns[paramKey] = fn;
        if (param.hasInput) {
            $('#' + paramKey + '-input').change(fn);
            $('#' + paramKey + '-input').click(fn);
        }
        $('#' + paramKey + '-Select').change(fn);
        $('#' + paramKey + '-Select').click(fn);
    }

    // Update / Apply / Done buttons
    $("#update").click(function(){ updateWT(); });
    $("#ApplyBtn").click(updateWT);

    $("#DoneBtn").click(function(){
        updateWT();
        $("#settings").hide();
        $("#settingsShow").show();
    });

    $("#DoneLDSBtn").click(function(){
        CityMenuFn();
        $("#locdataSet").hide();
        $("#locdataSetShow").show();
        $("#dateRangePanel").show();
    });

    $("#DefaultDRSBtn").click(function(){
        Info.prevdays = 0;
        Info.nextdays = 30;
        $("#prevdays").val(Info.prevdays);
        $("#nextdays").val(Info.nextdays);
        updateWT();
        $.cookie(_C.prevdays(), Info.prevdays, { expires: 71 });
        $.cookie(_C.nextdays(), Info.nextdays, { expires: 71 });
    });
    $("#DoneDRSBtn").click(function(){
        DateRangeFn();
        $("#dateRange").hide();
        $("#dateRangeShow").show();
    });
    $("#ApplyDRSBtn").click(DateRangeFn);
    function DateRangeFn(){
        var temp = $("#prevdays").val();
        Info.prevdays = prayTimes.eval(temp);
        temp = $("#nextdays").val();
        Info.nextdays = prayTimes.eval(temp);
        if (Info.prevdays > 9999) Info.prevdays = 999;
        if (Info.nextdays > 9999) Info.nextdays = 999;
        $.cookie(_C.prevdays(), Info.prevdays, { expires: 71 });
        $.cookie(_C.nextdays(), Info.nextdays, { expires: 71 });
        updateWT();
    }

    // Latitude/Longitude/Altitude manual input toggle
    $("#Latitude-input").attr('disabled','true').css("background","#f7f7e7");
    $("#Longitude-input").attr('disabled','true').css("background","#f7f7e7");
    $("#Altitude-input").attr('disabled','true').css("background","#f7f7e7");
    $("#manualInput").change(function(){
        if ($(this).attr("checked")) {
            $("#Latitude-input").removeAttr('disabled').css("background","#FFFFF7");
            $("#Longitude-input").removeAttr('disabled').css("background","#FFFFF7");
            $("#Altitude-input").removeAttr('disabled').css("background","#FFFFF7");
        } else {
            $("#Latitude-input").attr('disabled','true').css("background","#f7f7e7");
            $("#Longitude-input").attr('disabled','true').css("background","#f7f7e7");
            $("#Altitude-input").attr('disabled','true').css("background","#f7f7e7");
        }
    });

    // Tipsy tooltips
    $('.TipsySpan').tipsy({gravity: 's'});
    $('.TipsySpan-e').tipsy({gravity: 'e'});
    $('.TipsySpan-w').tipsy({gravity: 'w'});
    $('.TipsySpan-x').tipsy({gravity: 'x'});
    $('.TipsySpan-n').tipsy({gravity: 'n'});
    $('.TipsySpan-wh').tipsy({gravity: 'w', keep: 'yes'});
    $('.timeFormats-Select option').tipsy({gravity: 'w'});
});
