var bcrypt = require('bcryptjs'),
    Q = require('q'),
    fs = require('fs'),
    db = require('orchestrate')("b8be7a87-59cd-44ec-b36d-90f78b313e8f"); //config.db holds Orchestrate token

function random (low, high) {
    return Math.random() * (high - low) + low;
}

function localReg() {
  var deferred = Q.defer();
  var hash = bcrypt.hashSync("lucid test platform"+random(1,1000000), 8);
  console.log("hash: "+hash);
  var d = new Date();
  var user = {
    "id": hash,
    "date_debut": d.getTime()
  }
  db.get('local-users', hash)
  .then(function (result){ //case in which user already exists in db
    console.log('username already exists');
    localReg();
  })
  .fail((result) => {
    db.put('local-users', hash, user)
    .then(function () {
      console.log("USER: ");
      console.log(user);
      deferred.resolve(user);
    })
    .fail(function (err) {
      console.log("PUT FAIL:" + err.body);
      deferred.reject(new Error(err.body));
    });
  })

  return deferred.promise
}

function setup(id, data) {

  var d = new Date();
  data['date_debut'] = d.getTime();
  data['id'] = id;
  console.log("SETUP");
  console.log(data);

  db.put('local-users', id, data)

}

exports.localReg = localReg;
exports.setup = setup;
