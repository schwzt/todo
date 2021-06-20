const express = require("express");
const bodyParser = require("body-parser");
const date = require(`${__dirname}/date.js`);
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:zm4oMeQgtCtu5TLX@cluster0.qeyaj.mongodb.net/ToDo?retryWrites=true&w=majority", {
  useNewUrlParser: true,
});

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to ToDo List",
});

const item2 = new Item({
  name: "Press the + to create a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved to database");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save((err, result) => {
        res.redirect(`/${listName}`);
      });
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("Successfully deleted item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

app.get("/:listName", (req, res) => {
  const customListName = _.capitalize(req.params.listName);
  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save((err, result) => {
          res.redirect(`/${customListName}`);
        });
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {
  console.log("Server has been started on port 3000");
});
