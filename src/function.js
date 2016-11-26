var bcrypt = require('bcryptjs'),
    Q = require('q'),
    fs = require('fs'),
    bluebird = require("bluebird"),
    db = require('orchestrate')("b8be7a87-59cd-44ec-b36d-90f78b313e8f"); //config.db holds Orchestrate token

var json2csv = require('json2csv');

function exportCSV(hash) {
  getList(hash)
  .then((resp) => {
    var fields = ['Date','Type','Rétention','Loc'];
    console.log(fields);
    var respon = resp.data;
    console.log(respon);
    var final = "Date;Type;Rétention;Loc"+"\n";
    for (var i=0;i<respon.length;i++){
      var tp = (respon[i].type == 1 ? "Mixion" : "Fuite");
      var gps = "["+respon[i].gps[0]+","+respon[i].gps[1]+"]";
      final += respon[i].date+";"+tp+";"+respon[i].delay+";"+gps+"\n";
    }
    console.log(final);
    fs.writeFile("resultats.csv",final,(err) => {
      console.log("Written");
    })
  })
}

function getList(hash) {
  var deferred = Q.defer();
  db.get('local-users', hash)
  .then(function (result){
    deferred.resolve(result.body)
  })
  .fail(function (err) {
    console.log("No entry");
    deferred.resolve(err);
  });
  return deferred.promise;
}

function saveData(id,evenement) {
  var deferred = Q.defer();
  var even = {
    date: evenement.init,
    type: evenement.type,
    delay: evenement.delay,
    gps: [1.26,-2.695],
    context: {weather:"normal"}
  };
  getList(id)
  .then((result) => {
    var entries = result.data;
    entries.push(even);
    var data = { data:entries }
    db.put('local-users',id,data)
    .then(() => {
      console.log("Added data for user "+id+", "+even);
      deferred.resolve(true)
    })
    .fail(function (err) {
      console.log("PUT FAIL:" + err.body);
      deferred.reject(new Error(err.body));
    });
  })
  .fail(() => {
    var data = { data: [even] };
    db.put('local-users',id,data)
    .then(() => {
      console.log("Added first data for user "+id+", "+even);
      deferred.resolve(username)
    })
    .fail(function (err) {
      console.log("PUT FAIL:" + err.body);
      deferred.reject(new Error(err.body));
    });
  })
  return deferred.promise;
}

exports.saveData = saveData;
exports.getList = getList;
exports.exportCSV = exportCSV;
