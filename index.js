require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();
const {lookup} = require('dns-lookup-cache');
let bodyParser = require('body-parser');
const regexIdx = /\d/g;

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

console.log("starting");

// need MongoDB...

/*
2. You can POST a URL to /api/shorturl and get a JSON response with original_url and short_url properties. Here's an example: { original_url : 'https://freeCodeCamp.org', short_url : 1}

4. If you pass an invalid URL that doesn't follow the valid http://www.example.com format, the JSON response will contain { error: 'invalid url' }
*/
app.post("/api/shorturl", (req, res) => {
  const {url} = req.body;
  const regexURL = /https?:\/\//;
  const wrkURL = url.replace(regexURL, "");

  console.log(`${url} regexed into ${wrkURL}` + "\n");
//  console.log(req);
//  console.log(res);

  // NB: the dns checks only work with domain (primary website), no paths (sub pages)
  //     so trim off the post domain path
  if (regexURL.test(url))
  {
    lookup(wrkURL.split("/")[0], {}, (err, address, family) =>
    {
      console.log("checking site");
      if (err)
      {
        console.log(`Site is inoperable: ${err}` + "\n");
        res.json({error: "Invalid URL"} + "\n");
      } else
      {
        // callback hell
        Site.findOne({url: wrkURL})
        .then ((result1) =>
        {
          console.log(`first find: ${result1}`);
          Site.countDocuments()
          .then ((count) =>
          {
            console.log(count);
            if( count == 0)
            {
              console.log("No Found Records.");

              let newSite = new Site({
                url: wrkURL,
                index: count
              });

              newSite
              .save()
              .then((doc) =>
              {
                console.log(doc);
                res.json({original_url: wrkURL, short_url: count});
              })
              .catch((err) =>
              {
                console.error(err);
              })
            } else
            {
              console.log("Found Records : " + count);
              Site.find({}).sort({"index": -1}).limit(1)
              .then ((result2) =>
              {
                console.log(`first find: ${result1}, second find: ${result2}`);

                if (result1)
                {
                  console.log(`Found: ${result1}` + "\n");
                  res.json({ original_url: `https://${wrkURL}`, short_url: result1.index});
                }
                else
                {
                  // FCC really want the numeral only index for shortURL
                  // _id from the MongoDB used for shortURL will not pass test 2
                  // though will execute for test 3
                  console.log(`Creating entry in dB w ${result2}` + "\n");

                  const siteIdx = result2[0].index + 1;
                  console.log(`Highest index on dB: ${result2[0].index}, saving as ${siteIdx}`);

                  let newSite = new Site({
                    url: wrkURL,
                    index: siteIdx
                  });
                  console.log(`saving ${newSite}`);
                  newSite
                  .save()
                  .then((doc) =>
                  {
                    console.log(doc);
                    res.json({original_url: `https://${wrkURL}`, short_url: siteIdx});
                  })
                  .catch((err) =>
                  {
                    console.error(err);
                  })
                }
              })
            }
          })
          .catch ((err) =>
          {
            console.error(err);
          })
        })
        .catch ((err) =>
        {
          console.error(err);
        })
      }
    })
  } else
  {
    res.json({error: "Invalid URL"});
  }
});

/*
3. When you visit /api/shorturl/<short_url>, you will be redirected to the original URL.
*/
app.get("/api/shorturl/:idx", (req, res) => {
  console.log(req.params);
  const {idx} = req.params;

  if (regexIdx.test(idx)) {
    // find idx on the dB then redirect
    Site.findOne({index: idx})
    .then ((data) =>
    {
      if (data) {
        console.log("redirecting\n")
        res.redirect(`https://${data.url}`);
      } else {
        console.log("no site here\n");
        res.json({error: "No short URL found for the given input"});
      }
    })
    .catch ((err) =>
    {
      console.error(err);
    })
  } else {
    res.json({error:	"Wrong format"});
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
