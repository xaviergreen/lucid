var express = require('express'),
    session = require('express-session'),
    exphbs  = require('express3-handlebars');

var app = express();

var sign = require('./src/login');
var funct = require('./src/function');
require('dotenv').config();

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.session.id) { return next(); }
  res.send("Hey please sign in!");
}

app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(session({
  secret: 'lucid'
}));
app.use('/web',express.static(__dirname+'/web'));

var steps = ["sexe",]

var hbs = exphbs.create({
    defaultLayout: 'main'
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.get("/", (req,res) => {
  // console.log(process.env);
  return sign.localReg()
  .then((user) => {
    req.session.ids = user.id;
    req.session.setup = {
      page: 0
    };
    // res.render('home', {user: req.session.ids, text: "Choisissez votre sexe (F:1, M:2)"});
    res.redirect('/web/demo.html')
  })
})

app.get('/info', (req,res) => {
  var hash = req.session.ids;
  funct.exportCSV(hash);
  funct.getList(hash)
  .then((data) => {
    console.log("BACK HERE");
    console.log(data);
    res.send(data)
  })
})

app.post('/post',(req,res,next) => {
  var type = req.body.type;
  // console.log("SETUP: "+req.session.setup);
  // console.log("TYPE: "+type);
  // console.log(req.session.prev);
  // console.log(req.session.id);
  if (req.session.setup) {
    console.log("Setup");
    var page = req.session.setup.page;
    switch (page) {
      case 0:
        if (type == 1) {
          req.session.setup = {
            page: 1
          };
          req.session.user = {
            "sexe": "F"
          };
          req.session.save();
        } else if (type == 2){
          req.session.setup = {
            page: 1
          };
          req.session.user = {
            "sexe": "M"
          };
          req.session.save();
        }
        res.send({text: "Choisissez votre frequence de prise de comprimés (1 fois/2 fois)"});
        break;

      case 1:
        if (type == 1) {
          req.session.setup = {
            page: 2
          };
          req.session.user['freq'] = 1;
          req.session.save();
        } else if (type == 2) {
          req.session.setup = {
            page: 2
          };
          req.session.user['freq'] = 2;
          req.session.save();
        }
        res.send({text: "Choisissez votre dosage (simple/double)"});
        break;

        case 2:
          if (type == 1) {
            req.session.setup = {
              page: 3
            };
            req.session.user['dosage'] = 1;
            req.session.save();
          } else if (type == 2) {
            req.session.setup = {
              page: 3
            };
            req.session.user['dosage'] = 2;
            req.session.save();
          }
          var data = req.session.user;
          data['data'] = {};
          sign.setup(req.session.ids,data)
          delete req.session.setup;
          req.session.save();
          res.send({text: "Setup done!"});
          break;
    }
  } else {
    var d = new Date();
    var stringData = d.getHours()+":"+d.getMinutes()+" "+d.getDay()+"/"+d.getMonth()+"/"+d.getFullYear();
    if (type == 1) {
      if (req.session.prev) {
        console.log("TOILETTE");
        req.session.prev = false;
        var secNow = d.getTime();
        var init = req.session.time;
        var delay = (secNow-init)/1000;
        delete req.session.time;
        req.session.save();
        funct.saveData(req.session.ids,{type:1,delay:delay,init:stringData});
        res.send({text: "Vous avez bien tenu! "+delay+" secondes!"});
      } else {
        console.log("Setting first");
        req.session.prev = true;
        var d = new Date();
        req.session.time = d.getTime();
        req.session.save();
      }
    } else if (type == 2) {
      if (req.session.prev) {
        console.log("FUITE POSTERIEURE");
        req.session.prev = false;
        var secNow = d.getTime();
        var init = req.session.time;
        var delay = (secNow-init)/1000;
        delete req.session.time;
        req.session.save();
        funct.saveData(req.session.ids,{type:2,delay:delay,init:stringData});
        res.send({text: "Bien pris note de cette fuite apres "+delay+" secondes"});
      } else {
        console.log("FUITE IMMEDIATE");
        req.session.prev = false;
        req.session.save();
        funct.saveData(req.session.ids,{type:2,delay:0,init:stringData});
        res.send({text: "Bien pris note de cette fuite immédiate"});
      }
    }
  }
})

//===============PORT=================
var port = process.env.PORT || 5000;
app.listen(port);
console.log("listening on " + port + "!");
