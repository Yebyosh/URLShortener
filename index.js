require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('node:dns');
let bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const siteSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true }
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

//console.log("starting");

// need MongoDB...

/*
2. You can POST a URL to /api/shorturl and get a JSON response with original_url and short_url properties. Here's an example: { original_url : 'https://freeCodeCamp.org', short_url : 1}

4. If you pass an invalid URL that doesn't follow the valid http://www.example.com format, the JSON response will contain { error: 'invalid url' }
*/
app.post("/api/shorturl", (req, res) => {
  const {url} = req.body;
  const regexURL = /https?:\/\//;
  const wrkURL = url.replace(regexURL, "");

//  console.log(`${url} regexed into ${wrkURL}` + "\n");
//  console.log(req);
//  console.log(res);

  if (regexURL.test(url)) {
    dns.lookup(wrkURL, (err) =>
    {
//      console.log("checking site");
      if (err)
      {
//        console.log(`No such site: ${err}` + "\n");
        res.json({error:	"Invalid URL"} + "\n");
      } else
      {
        let wrkSite = Site.findOne({url: wrkURL})
        .then((doc) =>
        {
          if (doc)
          {
            console.log(`Found: ${doc}` + "\n");
            res.json({original_url: wrkURL, short_url: doc._id});
          }
          else
          {
//            console.log(`Creating ${wrkSite} in dB` + "\n");

            let newSite = new Site({
              url: wrkURL
            });

//            console.log(newSite);
//            console.log(newSite._id.toString());

            newSite
              .save()
              .then((doc) =>
              {
//                console.log(doc);
                res.json({original_url: wrkURL, short_url: newSite._id.toString()});
              })
              .catch((err) =>
              {
                console.error(err);
              });
          }
        })
        .catch((err) =>
        {
          console.error(err);
        });
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

  let idxSite = Site.findById({_id: idx})
  .then ((doc) =>
  {
    if (doc) {
      res.redirect(`https://${idxSite.url}`);
    } else {
      //console.log("no site here");
      res.json({error: "No short URL found for the given input"});
    }
  })
  .catch ((err) =>
  {
    console.error(err);
  })
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
