const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const {Schema, model} = mongoose;

mongoose.connect("mongodb://localhost:27017/exercise_tracker");

const userSchema = Schema({username: String});
const exerciseSchema = Schema({
    user_id: {type: String, required: true},
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: Date

  }
);

const User = model("User", userSchema);
const Exercise = model("Exercise", exerciseSchema);

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    return res.json(users);
  } catch(e) {
    console.log(e);
  }
});

app.post("/api/users", async (req,res) => {
  try {
  const userObj = new User({username: req.body.username});
  const user = await userObj.save();
  return res.json(user);

  }
  catch(e){
    console.log(e);
  }
});

app.post("/api/users/:_id/exercises", async (req,res) => {
  const id = req.params._id;
  const {description, duration, date} = req.body;
  try {

    const user = await User.findById(id);
    if (!user) res.send("No user with id :" + id);

    else {

      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration: parseInt(duration),
        date: date ? new Date(date) : new Date()
      })

      const exercise = await exerciseObj.save();

      console.log(user);
      console.log(exercise);

      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      });

    }
  } catch(e) {
    console.log(e);
  }

});

app.get("/api/users/:_id/logs", async (req,res) => {

  try {
    const {from, to, limit} = req.query;
    const user =await User.findById(req.params._id);
    if (!user) throw "No user with id :" + req.params._id;

    let filter = {user_id: user._id};

    let dateObj = {};
    if (from) {
      dateObj["$gte"] = new Date(from);
    }
    if (to) {
      dateObj["$lte"] = new Date(to);
    }
    if (from || to) {
      filter.date = dateObj;
    }
    const exercises = await Exercise.find(filter).limit(parseInt(limit));
    const log = exercises.map((obj) => ({
      description: obj.description, 
      duration: obj.duration,
      date: obj.date.toDateString()
    }));

    return res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: log

    })
  }catch(e){
    return res.send(e)
  }
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
