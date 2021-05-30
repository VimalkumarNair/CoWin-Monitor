document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    document.getElementById('deviceready').classList.add('ready');
    cordova.plugins.notification.local.requestPermission(function (granted) { });
    getStatus();
    setInterval(() => getStatus(), 300000);
}

const districts = [
    { "district_id": 265, "district_name": "Bangalore Urban" },
    { "district_id": 302, "district_name": "Malappuram" },
    { "district_id": 308, "district_name": "Palakkad" },
    { "district_id": 303, "district_name": "Thrissur" }
];

async function getStatus() {
    var message = '';
    var notificationData = [];
    for (let i = 0; i <= 2; i++) {
        const date = formatDate(new Date(Date.now()).addDays(i), 'dd-mm-yyyy');
        message += 'Date: ' + date + '<br>';
        let availableCapacity = 0;
        let error = '';
        await districts.reduce((p, district) =>
            p.then(_ => new Promise(resolve =>
                cordova.plugin.http.get('https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=' + district.district_id + '&date=' + date, {}, {},
                    function (response) {
                        availableCapacity = JSON.parse(response.data).centers.flatMap(q => q.sessions).
                            filter(q => q.min_age_limit == 18 && q.available_capacity > 0).
                            reduce((a, b) => (a.available_capacity) ? a.available_capacity + (b.available_capacity) ? b.available_capacity : 0 : (b.available_capacity) ? b.available_capacity : 0, 0);
                        resolve();
                    }, function (response) {
                        availableCapacity = 0;
                        error = 'Error: ' + response.status;
                        resolve();
                    })
            ).then(_ => {
                message += 'Capacity in ' + district.district_name + ': ' + availableCapacity + ' ' + error + '<br>';
                if (availableCapacity > 0) notificationData.push({ district: district.district_name, capacity: availableCapacity });
            }))
            , Promise.resolve());
        message += '<br>';
    }
    if (notificationData.length > 0) notify(notificationData);
    document.getElementById('lastRefresh').innerHTML = formatDate(new Date(Date.now()), 'HH:MM:SS AMPM');
    document.getElementById('messages').innerHTML = message;
}

function notify(data) {
    var message = '';
    data.forEach(element => {
        message += element.district + ': ' + element.capacity + '\n'
    });
    let currentDate = new Date();
    let noteOptions = {
        id: currentDate.getMilliseconds(),
        title: "New Vaccine Update",
        text: message,
        at: currentDate,
        badge: 1
    };
    cordova.plugins.notification.local.schedule(noteOptions);
}

Date.prototype.addDays = function (days) {
    const date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
};

function formatDate(date, format) {
    const map = {
        mm: (date.getMonth() + 1).toString().padStart(2, "0"),
        dd: date.getDate().toString().padStart(2, "0"),
        yyyy: date.getFullYear(),
        HH: (date.getHours() > 12 ? date.getHours() - 12 : date.getHours()).toString().padStart(2, "0"),
        MM: (date.getMinutes()).toString().padStart(2, "0"),
        SS: (date.getSeconds()).toString().padStart(2, "0"),
        AMPM: (date.getHours() > 12 ? 'PM' : 'AM')
    }
    return format.replace(/mm|dd|yyyy|HH|MM|SS|AMPM/gi, matched => map[matched])
}