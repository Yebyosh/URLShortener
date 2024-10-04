require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('node:dns');
let bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const siteSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  index: { type: Number, required: true, min: 0, unique: true }
});
let Site = mongoose.model('Site', siteSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// need MongoDB...

/*
2. You can POST a URL to /api/shorturl and get a JSON response with original_url and short_url properties. Here's an example: { original_url : 'https://freeCodeCamp.org', short_url : 1}

4. If you pass an invalid URL that doesn't follow the valid http://www.example.com format, the JSON response will contain { error: 'invalid url' }
*/
app.post("/api/shorturl", (req, res) => {
  const {url} = req.body;
  const regexURL = /https?:\/\//;
  const wrkURL = url.replace(regexURL, "");

  console.log(`${url} => ${wrkURL}`);
//  console.log(req);
//  console.log(res);

  if (regexURL.test(url)) {
    dns.lookup(wrkURL, (err) => {
      console.log(err);
      if (err) {
        res.json({error:	"Invalid URL"});
      } else {
        let wrkSite = Site.findOne({url: wrkURL});

        console.log(wrkSite);
        
        if (wrkSite) {
//          return res.status(400).send('User already exists.');
        } else {
          let idxSite = Site.sort({index: -1}).limit(1).select("index").exec(function(err, data) {
            if (err) {
              return done(err);
            } else {
              done(null, data);
            }
          });
          console.log(idxSite);
//          let new_idx = idxSite.index + 1;
//          wrkSite = new Site({wrkURL, new_idx);
//          Site.save();
          // create new entry
//          res.json(original_url: wrkURL, short_url: new_idx);;
        }
      }
    });
  } else {
    res.json({error:	"Invalid URL"});
  }
});

/*
3. When you visit /api/shorturl/<short_url>, you will be redirected to the original URL.
*/
app.get("/api/shorturl/:idx", (req, res) => {
  //console.log(req.params);
  const {idx} = req.params;

//  console.log(Number(idx));

  if (!isNaN(Number(idx))) {
    // find idx on the dB then redirect
    let idxSite = Site.findOne({index: idx});

  //  console.log(idxSite.index);
    
    if (idxSite.index == undefined) {
      //console.log("no site here");
      res.json({error: "No short URL found for the given input"});
    } else {
      res.redirect(`https://${idxSite.url}`);
    }
  } else {
    res.json({error:	"Wrong format"});
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
