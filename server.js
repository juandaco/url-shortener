const express = require('express'),
  path = require('path'),
  assert = require('assert'),
  MongoClient = require('mongodb').MongoClient;

const app = express();
const port = process.env.PORT || 8080;
const appURL = 'https://damp-fjord-84537.herokuapp.com/';
const dbURL = process.env.MONGOLAB_URI;


MongoClient.connect(dbURL, (err, db) => {

  assert.equal(null, err);
  console.log("Connected successfully to server");

  // Setup the collection to use
  const collection = db.collection('shortened');

  // Instructions for using the MicroService
  app.get('/', (req, res) => {
    res.send('You should request a URL shortened at /new/desiredURL/');
  });

  app.get('/new/*', (req, res) => {
    let url = req.params[0];

    // URL Validation with RegEx
    let validURL = /(http)s?(:\/\/).+\.\w{2,}/g.test(url);
    if (validURL) {

      // Check if URL is already stored in the DataBase 
      collection.find({}).toArray((err, docs) => {
        let doc,
          found = false;
        for (let i = 0, l = docs.length; i < l; i++) {
          if (docs[i].original_url === url) {
            found = true;
            doc = docs[i];
            break;
          }
        }

        // If found, answer with the stored version
        if (found) {
          delete doc._id;
          let s = doc.short_url;
          doc.short_url = appURL + s;
          res.json(doc);
        } else {
          // If not, generate new short id and return
          let shortURL,
            shortened = docs.map(doc => doc.short_url);

          do {
            shortURL = Math.floor(Math.random() * 9000 + 1000);
          } while (shortened.indexOf(shortURL) !== -1);

          doc = {
            original_url: url,
            short_url: shortURL,
          };
          // Add to the database
          collection.insertOne(doc);
          delete doc._id;
          doc.short_url = appURL + shortURL;
          res.json(doc);
        }
      });

    } else {
      res.json({ error: "Wrong url format, make sure you have a valid protocol and real site." });
    }
  });

  // Redirection
  app.get('/*', (req, res) => {
    let shortURL = parseInt(req.params[0]);

    collection.find({}).toArray((err, docs) => {
      let shortened = docs.map(doc => doc.short_url);
      let index = shortened.indexOf(shortURL);

      if (index !== -1) {
      	let url = docs[index].original_url;
      	res.redirect(url);
      } else {
      	res.send('There isn\'t a shortened version in the database');
      }
    });
  });


  app.listen(port, function() {
    const p = this.address().port;
    console.log(`Server is listening on port ${p}\n`);
  });
});
